// ============================================================================
// dashboard.ts — Ráp dữ liệu dashboard từ Supabase về đúng shape DashboardData
// ----------------------------------------------------------------------------
// Route GET /api/dashboard gọi buildDashboard(userId, scope).
// Mọi mapping DB -> type UI nằm ở đây để Route Handler giữ mỏng.
// ============================================================================
import type {
  AssessmentSummaryRecord,
  Challenge,
  CheckinRecord,
  CoachingRequest,
  CoachingSlot,
  DashboardData,
  EvaluationAnswerRecord,
  EvaluationQuestion,
  EvaluationRecord,
  EvaluationTemplate,
  FinalQuizResult,
  GroupCheckinRecord,
  LeaderboardUser,
  PeerGroupMember,
  PeerGroupOption,
  PracticeExercise,
  Workshop,
} from "@/types/ldkt";
import { getServiceSupabase } from "./supabaseServer";
import { readMeta } from "./http";
import { calculateLongestStreak, calculateStreak, getTotalXp, getTotalXpBatch } from "./xp";

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function normalizeWorkshopStatus(s: string): "done" | "now" | "locked" {
  const k = (s || "").toLowerCase();
  if (k === "done" || k === "now") return k;
  return "locked"; // 'draft' và giá trị lạ đều coi như locked (fail-close)
}

function normalizeQuestionType(t: string): EvaluationQuestion["type"] {
  const k = (t || "").toLowerCase();
  if (k === "rating" || k === "scale" || k === "text" || k === "single_choice") return k;
  if (k === "multiple_choice" || k === "multi_choice") return "multi_choice";
  return "text";
}

function splitOptions(options: string | null): string[] {
  if (!options) return [];
  return options
    .split(/\s*\|\s*|\s*\/(?=[A-Z]:)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function buildDashboard(userId: string, scope: "home" | "full" = "home"): Promise<DashboardData> {
  const db = getServiceSupabase();
  const full = scope === "full";

  const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  const cohortId: string | null = profile.cohort_id;

  // ---- Nội dung chung (global hoặc đúng cohort) -----------------------------
  // cohort_id NULL = nội dung dùng chung mọi cohort
  const wsQ = db.from("workshops").select("*").order("sort_order");
  const prQ = db.from("practice_exercises").select("*").order("sort_order");
  const tpQ = db.from("evaluation_templates").select("*");
  if (cohortId) {
    const f = `cohort_id.is.null,cohort_id.eq.${cohortId}`;
    wsQ.or(f);
    prQ.or(f);
    tpQ.or(f);
  } else {
    wsQ.or("cohort_id.is.null");
    prQ.or("cohort_id.is.null");
    tpQ.or("cohort_id.is.null");
  }

  const [workshopsRes, challengesRes, practiceRes, templatesRes] = await Promise.all([
    wsQ,
    db.from("mini_challenges").select("*").order("workshop_id").order("day"),
    prQ,
    tpQ,
  ]);

  const workshops: Workshop[] = (workshopsRes.data || []).map((w) => ({
    id: w.id,
    order: w.sort_order,
    title: w.title,
    description: w.description || "",
    status: normalizeWorkshopStatus(w.status),
    scheduleDate: w.session_date || undefined,
    flashcardUrl: w.flashcard_url || undefined,
  }));

  const challenges: Challenge[] = (challengesRes.data || []).map((c) => ({
    id: c.id,
    workshopId: c.workshop_id,
    day: c.day,
    title: c.title,
    description: c.description || "",
    instruction: c.instruction || "",
    status: c.status,
    date: c.challenge_date || undefined,
  }));

  const practiceExercises: PracticeExercise[] = (practiceRes.data || []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    instruction: p.instruction || "",
    type: p.type,
    durationSeconds: p.duration_seconds || 0,
    mediaUrl: p.media_url || undefined,
    linkedChallengeId: p.linked_challenge_id || undefined,
    status: p.status,
    order: p.sort_order,
  }));

  const evaluationTemplates: EvaluationTemplate[] = (templatesRes.data || []).map((t) => ({
    id: t.id,
    // Giữ tương thích type cũ của UI: other_before -> "peer"
    type: (t.type === "other_before" ? "peer" : t.type) as EvaluationTemplate["type"],
    workshopId: t.workshop_id || "",
    sessionType: (t.session_type || "main") as EvaluationTemplate["sessionType"],
    title: t.title,
    description: t.description || "",
    // Giữ nguyên logic cũ: chỉ quiz mới cần thêm điều kiện is_open;
    // template thường chỉ cần status='active'
    status: t.type === "final_quiz" ? (t.status === "active" && t.is_open ? "active" : "locked") : t.status,
    formUrl: t.form_url || undefined,
  }));

  // ---- Dữ liệu của user ------------------------------------------------------
  const [checkinsRes, responsesRes, quizRes, peerGroupsRes, membersRes, groupCheckinsRes, myRequestsRes, myBookingsRes, slotsRes] =
    await Promise.all([
      db.from("checkins").select("*, mini_challenges!inner(workshop_id)").eq("user_id", userId).order("checkin_date"),
      db.from("evaluation_responses").select("*").eq("user_id", userId).order("created_at"),
      db
        .from("evaluation_responses")
        .select("*, evaluation_templates!inner(type)")
        .eq("user_id", userId)
        .eq("evaluation_templates.type", "final_quiz"),
      db.from("peer_groups").select("*").eq("status", "active"),
      db.from("peer_group_members").select("*, peer_groups(name)").eq("user_id", userId),
      db.from("group_checkins").select("*").eq("user_id", userId),
      db.from("coaching_requests").select("*").eq("user_id", userId).order("requested_at", { ascending: false }),
      db.from("coaching_bookings").select("id, slot_id, request_id, status").eq("user_id", userId),
      db.from("coaching_slots").select("*").order("starts_at"),
    ]);

  const checkinRows = checkinsRes.data || [];
  const checkins: CheckinRecord[] = checkinRows.map((c) => ({
    id: c.id,
    workshopId: (c as unknown as { mini_challenges?: { workshop_id?: string } }).mini_challenges?.workshop_id || "",
    challengeId: c.challenge_id,
    day: 0,
    completed: true,
    mood: c.mood || "",
    insight: c.insight || "",
    nextAction: c.next_action || "",
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  const responseRows = responsesRes.data || [];
  const responseIds = responseRows.map((r) => r.id);
  type AnswerRow = {
    id: string;
    response_id: string;
    question_id: string;
    answer_text: string | null;
    answer_value: number | null;
    selected_options: string[] | null;
    created_at: string;
  };
  let answerRows: AnswerRow[] = [];
  if (responseIds.length) {
    const { data } = await db.from("evaluation_answers").select("*").in("response_id", responseIds);
    answerRows = (data || []) as AnswerRow[];
  }

  const evaluations: EvaluationRecord[] = responseRows.map((r) => {
    const ans = answerRows.filter((a) => a.response_id === r.id);
    const nums = ans.map((a) => Number(a.answer_value)).filter((n) => Number.isFinite(n));
    const texts = ans.map((a) => a.answer_text).filter((t) => t && Number.isNaN(Number(t)));
    const m = readMeta(r);
    return {
      id: r.id,
      workshopId: "",
      templateId: r.template_id,
      sessionType: m.sessionType as string | undefined,
      respondentType: (m.respondentType as string) || "self",
      rating: nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0,
      feedback: texts[0] || "",
      updatedAt: r.updated_at,
    };
  });

  const evaluationAnswers: EvaluationAnswerRecord[] = answerRows.map((a) => ({
    id: a.id,
    responseId: a.response_id,
    userId: userId,
    templateId: "",
    questionId: a.question_id,
    value: a.answer_text ?? (a.answer_value != null ? String(a.answer_value) : (a.selected_options || []).join(",")),
    createdAt: a.created_at,
    updatedAt: a.created_at,
  }));

  // Câu hỏi chi tiết chỉ load khi scope=full (trang form đánh giá)
  type QuestionRow = {
    question_id: string;
    template_id: string;
    sort_order: number;
    question_text: string;
    question_type: string;
    options: string | null;
    is_required: boolean;
    dimension: string | null;
  };
  let evaluationQuestions: EvaluationQuestion[] = [];
  if (full) {
    const templateIds = evaluationTemplates.map((t) => t.id);
    let qRows: QuestionRow[] = [];
    if (templateIds.length) {
      const { data } = await db.from("evaluation_questions").select("*").in("template_id", templateIds).order("sort_order");
      qRows = (data || []) as QuestionRow[];
    }
    evaluationQuestions = qRows.map((q) => ({
      id: q.question_id,
      templateId: q.template_id,
      order: q.sort_order,
      text: q.question_text,
      type: normalizeQuestionType(q.question_type),
      options: splitOptions(q.options),
      required: q.is_required,
      dimension: q.dimension || "",
    }));
  }

  const finalQuizResults: FinalQuizResult[] = (quizRes.data || []).map((r) => {
    const m = readMeta(r);
    return {
      attemptId: r.id,
      templateId: r.template_id,
      status: r.submitted_at ? "submitted" : "in_progress",
      startedAt: r.started_at || r.created_at,
      expiresAt: (m.expiresAt as string) || "",
      submittedAt: r.submitted_at || "",
      objectiveScore: Number(r.score) || 0,
      essayScore: Number(m.essayScore) || 0,
      finalScore: Number(r.score) || 0,
      gradingStatus: (m.gradingStatus as string) || "",
      feedback: (m.instructorFeedback as string) || "",
      publishedAt: (m.publishedAt as string) || "",
    };
  });

  // Peer groups
  const myGroupIds = new Set((membersRes.data || []).map((m) => m.group_id));
  const peerGroupOptions: PeerGroupOption[] = (peerGroupsRes.data || [])
    .filter((g) => !g.cohort_id || g.cohort_id === cohortId)
    .map((g) => ({ id: g.id, name: g.name, maxMembers: g.max_members, status: g.status, memberCount: 0 }));
  // Đếm thành viên mỗi nhóm (1 query)
  const { data: allMembers } = await db.from("peer_group_members").select("group_id");
  const countByGroup = new Map<string, number>();
  for (const m of allMembers || []) countByGroup.set(m.group_id, (countByGroup.get(m.group_id) || 0) + 1);
  peerGroupOptions.forEach((o) => (o.memberCount = countByGroup.get(o.id) || 0));

  const peerGroupMembers: PeerGroupMember[] = (membersRes.data || []).map((m) => ({
    groupId: m.group_id,
    groupName: (m as unknown as { peer_groups?: { name?: string } }).peer_groups?.name || m.group_id,
    userId: m.user_id,
    userName: profile.full_name,
    role: m.role,
    status: "active",
  }));

  const myGroupId = [...myGroupIds][0];
  let groupCheckins: GroupCheckinRecord[] = [];
  if (myGroupId) {
    const { data: gcRows } = await db.from("group_checkins").select("*").eq("group_id", myGroupId);
    groupCheckins = (gcRows || []).map((g) => ({
      id: g.id,
      groupId: g.group_id,
      week: 0,
      userId: g.user_id,
      met: true,
      insight: g.content || "",
      nextAction: "",
      createdAt: g.created_at,
    }));
  } else {
    groupCheckins = (groupCheckinsRes.data || []).map((g) => ({
      id: g.id,
      groupId: g.group_id,
      week: 0,
      userId: g.user_id,
      met: true,
      insight: g.content || "",
      nextAction: "",
      createdAt: g.created_at,
    }));
  }

  // Coaching: requests của user + slot đang mở
  const bookingByRequest = new Map((myBookingsRes.data || []).map((b) => [b.request_id, b]));
  const coachingRequests: CoachingRequest[] = (myRequestsRes.data || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    xp: 0,
    requestedAt: r.requested_at,
    status: r.status as CoachingRequest["status"],
    assignedSlotId: bookingByRequest.get(r.id)?.slot_id || "",
  }));
  const coachingSlots: CoachingSlot[] = (slotsRes.data || [])
    .filter((s) => s.status === "open" && (!s.cohort_id || s.cohort_id === cohortId))
    .map((s) => ({
      id: s.id,
      startAt: s.starts_at,
      endAt: s.ends_at,
      coachName: s.coach_name,
      meetingLink: s.meeting_link || "",
      status: s.status,
      bookedUserId: "",
    }));

  // Peer feedback count: số đánh giá peer nhắm tới chính user này
  const { data: peerTemplateRows } = await db.from("evaluation_templates").select("id").eq("type", "other_before");
  const peerTemplateIds = (peerTemplateRows || []).map((t) => t.id);
  const { count: peerFeedbackCount } = peerTemplateIds.length
    ? await db
        .from("evaluation_responses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("template_id", peerTemplateIds)
    : { count: 0 };

  // Leaderboard: top XP trong cohort (từ xp_events)
  const { data: cohortProfiles } = await db
    .from("profiles")
    .select("id, student_code, full_name, cohort_id, status")
    .eq("status", "active")
    .limit(200);
  const cohortMembers = (cohortProfiles || []).filter((p) => !cohortId || p.cohort_id === cohortId);
  const xpMap = await getTotalXpBatch(cohortMembers.map((p) => p.id));
  const leaderboardUsers: LeaderboardUser[] = cohortMembers
    .map((p) => ({
      id: p.student_code,
      name: p.full_name,
      initials: getInitials(p.full_name),
      batch: p.cohort_id || "",
      currentWorkshopIndex: 0,
      status: "Active",
      xp: xpMap.get(p.id) || 0,
    }))
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 20)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  // XP + streak của chính user
  const myXp = await getTotalXp(userId);
  const myCheckinDates = checkinRows.map((c) => c.checkin_date);
  const streak = calculateStreak(myCheckinDates);
  const longestStreak = calculateLongestStreak(myCheckinDates);

  // Chỉ số workshop hiện tại: workshop 'now' đầu tiên, fallback theo số lượng done
  const nowIdx = workshops.findIndex((w) => w.status === "now");
  const currentWorkshopIndex = nowIdx >= 0 ? nowIdx : workshops.filter((w) => w.status === "done").length;

  const totalDays = challenges.length;
  const doneDays = new Set(checkinRows.map((c) => c.challenge_id)).size;

  return {
    student: {
      id: profile.student_code,
      name: profile.full_name,
      initials: getInitials(profile.full_name),
      batch: profile.cohort_id || "",
      role: profile.is_admin ? "Quản trị" : "Học viên",
      team: "",
      email: profile.email || undefined,
      participationStatus: profile.status === "active" ? "Active" : profile.status,
    },
    workshops,
    challenges,
    practiceExercises,
    checkins,
    evaluations,
    evaluationTemplates,
    evaluationQuestions,
    evaluationAnswers,
    finalQuizResults,
    peerFeedbackCount: peerFeedbackCount || 0,
    peerGroupOptions,
    peerGroupMembers,
    groupCheckins,
    assessmentSummary: [] as AssessmentSummaryRecord[],
    coachingRequests,
    coachingSlots,
    leaderboardUsers,
    currentWorkshopIndex,
    currentMiniChallengeDay: Math.min(doneDays + 1, totalDays || 1),
    miniChallengeTotalDays: totalDays,
    // Trường mở rộng (không có ở type cũ — client bỏ qua nếu không dùng)
    ...( { xp: myXp, streak, longestStreak } as object ),
  } as DashboardData;
}
