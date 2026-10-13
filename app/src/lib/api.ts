// ============================================================================
// api.ts — Lớp gọi API cho app học viên (VIẾT LẠI cho re-platform)
// ----------------------------------------------------------------------------
// GIỮ NGUYÊN toàn bộ tên hàm, chữ ký và kiểu trả về so với bản cũ để
// page.tsx và các screens KHÔNG phải sửa. Chỉ đổi implementation bên trong:
//  - Cũ: gọi Google Apps Script qua GAS_API_URL + token thủ công.
//  - Mới: gọi Next.js Route Handlers (/api/...) cùng origin; phiên đăng nhập
//    do Supabase Auth quản lý (cookie), không còn token thủ công.
// Các hàm getInitialAuthToken/setAuthToken/clearAuthToken giữ lại dạng
// tương thích (không còn tác dụng thực tế).
// ============================================================================
import type {
  Challenge,
  Checkin,
  DashboardData,
  Evaluation,
  EvaluationTemplate,
} from "@/types/ldkt";
import { getSupabaseBrowser } from "./supabaseClient";
import { readJson, writeJson } from "./local-store";

const STORAGE_KEYS = {
  checkin: "ldkt.v2.checkin",
  evaluation: "ldkt.v2.evaluation",
  dashboardCache: "ldkt.v2.dashboardCache",
};

export type RegistrationData = {
  fullName: string;
  birthYear: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  companyName: string;
  industryGroup: string;
  totalWorkingYears: string;
  isPeopleManager: string;
  teamSize: string;
  leadershipYears: string;
  acquisitionSource: string;
  registrationMotivation: string;
  leadershipChallenge: string;
};

export type SaveResult = {
  localSaved: boolean;
  remoteSaved: boolean;
  remoteConfigured: boolean;
  rejected?: boolean;
  code?: string;
  error?: string;
  mode?: "inserted" | "updated";
};

export type DashboardLoadResult = {
  data: DashboardData;
  remoteLoaded: boolean;
  remoteConfigured: boolean;
  fromCache?: boolean;
};

export type DashboardScope = "home" | "full";

type ApiEnvelope = {
  ok?: boolean;
  error?: string;
  code?: string;
  mode?: "inserted" | "updated" | "invited" | "existing" | "booked";
  data?: DashboardData;
  [key: string]: unknown;
};

async function apiFetch(path: string, init?: RequestInit): Promise<ApiEnvelope | null> {
  try {
    const response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const payload = (await response.json().catch(() => null)) as ApiEnvelope | null;
    if (!payload) return null;
    if (!response.ok && payload.ok === undefined) {
      return { ok: false, error: (payload as { error?: string }).error || `Lỗi ${response.status}` };
    }
    return payload;
  } catch (error) {
    console.warn("[api]", error);
    return null;
  }
}

function getSaveResult(remote: ApiEnvelope | null): SaveResult {
  return {
    localSaved: true,
    remoteConfigured: true,
    remoteSaved: Boolean(remote?.ok),
    rejected: Boolean(remote && !remote.ok),
    code: remote?.code,
    error: remote?.error,
    mode: remote?.mode === "inserted" || remote?.mode === "updated" ? remote.mode : undefined,
  };
}

// --- Dashboard rỗng dùng khi chưa tải được (thay mock data cũ) ----------------
function emptyDashboard(): DashboardData {
  return {
    student: { id: "", name: "", initials: "", batch: "", role: "", team: "" },
    workshops: [],
    challenges: [],
    practiceExercises: [],
    checkins: [],
    evaluations: [],
    evaluationTemplates: [],
    evaluationQuestions: [],
    evaluationAnswers: [],
    finalQuizResults: [],
    peerFeedbackCount: 0,
    peerGroupOptions: [],
    peerGroupMembers: [],
    groupCheckins: [],
    assessmentSummary: [],
    coachingRequests: [],
    coachingSlots: [],
    leaderboardUsers: [],
    currentWorkshopIndex: 0,
    currentMiniChallengeDay: 1,
    miniChallengeTotalDays: 0,
  };
}

/** Giữ chữ ký cũ: trả dashboard rỗng (dữ liệu thật lấy qua loadDashboard). */
export function getDashboard(): DashboardData {
  return getCachedDashboardSnapshot() || emptyDashboard();
}

// --- Token shims (tương thích bản cũ; session thật do Supabase quản lý) -------
export function getInitialAuthToken() {
  return "";
}

export function setAuthToken(_token: string) {
  // Không còn dùng token thủ công. Giữ hàm để code cũ không vỡ.
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    try {
      const supabase = getSupabaseBrowser();
      void supabase.auth.signOut();
    } catch {
      // bỏ qua
    }
    window.localStorage.removeItem(STORAGE_KEYS.dashboardCache);
  }
}

// --- Auth --------------------------------------------------------------------
export async function loginUser(identifier: string, studentCode: string) {
  const cleanedIdentifier = identifier.trim();
  const cleanedStudentCode = studentCode.trim();
  if (!cleanedIdentifier || !cleanedStudentCode) {
    return { ok: false, error: "Nhập email/số điện thoại và mã học viên" };
  }

  const remote = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: cleanedIdentifier, studentCode: cleanedStudentCode }),
  });
  if (!remote) return { ok: false, error: "Không kết nối được hệ thống" };
  if (!remote.ok) return { ok: false, error: remote.error || "Không tìm thấy học viên", code: remote.code };

  // mode: "invited" (đã gửi email kích hoạt) | "exists" (đã có tài khoản -> nhập mật khẩu)
  return { ok: true, mode: remote.mode, email: remote.email, studentCode: remote.studentCode };
}

/** Đăng nhập bằng mật khẩu sau khi tài khoản đã được kích hoạt. */
export async function loginWithPassword(email: string, password: string) {
  if (!email.trim() || !password) return { ok: false, error: "Nhập email và mật khẩu" };
  try {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: "Email hoặc mật khẩu chưa đúng." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Không kết nối được hệ thống" };
  }
}

export async function registerUser(data: RegistrationData) {
  if (!data.fullName.trim() || !data.email.trim()) {
    return { ok: false, error: "Nhập họ tên và email để đăng ký nhé" };
  }
  const remote = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
  if (!remote) return { ok: false, error: "Không kết nối được hệ thống" };
  if (!remote.ok) return { ok: false, error: remote.error || "Chưa đăng ký được học viên" };
  return { ok: true, mode: remote.mode, email: remote.email, studentCode: remote.studentCode };
}

/** Lấy phiên đăng nhập hiện tại (mới thêm, tiện cho UI). */
export async function getSessionUser() {
  const remote = await apiFetch("/api/auth/session");
  if (remote?.ok && remote.user) return remote.user as Record<string, unknown>;
  return null;
}

// --- Dashboard ----------------------------------------------------------------
function getCacheKey(): string {
  if (typeof window === "undefined") return "anonymous";
  return window.localStorage.getItem("ldkt.v2.uid") || "anonymous";
}

function getCachedDashboard(): DashboardData | null {
  const cache = readJson<Record<string, { savedAt: string; data: DashboardData }>>(STORAGE_KEYS.dashboardCache, {});
  return cache[getCacheKey()]?.data || null;
}

function writeCachedDashboard(data: DashboardData) {
  if (typeof window === "undefined") return;
  const cache = readJson<Record<string, { savedAt: string; data: DashboardData }>>(STORAGE_KEYS.dashboardCache, {});
  cache[getCacheKey()] = { savedAt: new Date().toISOString(), data };
  writeJson(STORAGE_KEYS.dashboardCache, cache);
}

export function getCachedDashboardSnapshot() {
  return getCachedDashboard();
}

export async function loadDashboardWithStatus(scope: DashboardScope = "home"): Promise<DashboardLoadResult> {
  const cached = getCachedDashboard();
  const remote = await apiFetch(`/api/dashboard?scope=${scope}`);
  if (!remote?.ok || !remote.data) {
    return {
      data: cached || emptyDashboard(),
      remoteLoaded: false,
      remoteConfigured: true,
      fromCache: Boolean(cached),
    };
  }
  if (typeof remote.uid === "string" && remote.uid && typeof window !== "undefined") {
    window.localStorage.setItem("ldkt.v2.uid", remote.uid);
  }
  writeCachedDashboard(remote.data);
  return { data: remote.data, remoteLoaded: true, remoteConfigured: true };
}

export async function loadDashboard(scope: DashboardScope = "home"): Promise<DashboardData> {
  return (await loadDashboardWithStatus(scope)).data;
}

// --- Check-in ------------------------------------------------------------------
export function getCheckin(): Checkin {
  return readJson<Checkin>(STORAGE_KEYS.checkin, { status: "done", mood: "", insight: "", nextAction: "" });
}

export async function saveCheckin(checkin: Checkin, day = 1, challenge?: Challenge) {
  writeJson(STORAGE_KEYS.checkin, checkin);
  const remote = await apiFetch("/api/checkins", {
    method: "POST",
    body: JSON.stringify({
      challengeId: challenge?.id || `MC3-D${day}`,
      day,
      workshopId: challenge?.workshopId,
      completed: checkin.status === "done",
      mood: checkin.mood,
      insight: checkin.insight,
      nextAction: checkin.nextAction,
    }),
  });
  return getSaveResult(remote);
}

// --- Đánh giá -------------------------------------------------------------------
export function getEvaluation(): Evaluation {
  return readJson<Evaluation>(STORAGE_KEYS.evaluation, { rating: 5, feedback: "" });
}

export async function saveEvaluation(evaluation: Evaluation, workshopId = "WS3") {
  writeJson(STORAGE_KEYS.evaluation, evaluation);
  const remote = await apiFetch("/api/evaluations/simple", {
    method: "POST",
    body: JSON.stringify({ workshopId, rating: evaluation.rating, feedback: evaluation.feedback }),
  });
  return getSaveResult(remote);
}

export async function saveEvaluationResponse(template: EvaluationTemplate, answers: Record<string, string>) {
  const remote = await apiFetch("/api/evaluations/responses", {
    method: "POST",
    body: JSON.stringify({
      templateId: template.id,
      workshopId: template.workshopId,
      sessionType: template.sessionType,
      answers,
    }),
  });
  if (remote && remote.ok === false) {
    return {
      localSaved: false,
      remoteConfigured: true,
      remoteSaved: false,
      rejected: true,
      code: remote.code,
      error: remote.error || "Chưa lưu được đánh giá.",
    };
  }
  return getSaveResult(remote);
}

// --- Quiz ------------------------------------------------------------------------
export async function startFinalQuiz(templateId: string) {
  const remote = await apiFetch("/api/quiz/start", { method: "POST", body: JSON.stringify({ templateId }) });
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Chưa bắt đầu được bài thi." };
  return { ok: true as const, attempt: remote.attempt, questions: remote.questions };
}

export async function submitFinalQuiz(templateId: string, answers: Record<string, string>) {
  const remote = await apiFetch("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ templateId, answers }),
  });
  if (remote && remote.ok === false) {
    return {
      localSaved: false,
      remoteConfigured: true,
      remoteSaved: false,
      rejected: true,
      code: remote.code,
      error: remote.error || "Chưa nộp được bài thi.",
    };
  }
  return getSaveResult(remote);
}

// --- Peer group --------------------------------------------------------------------
export async function joinPeerGroup(groupId: string) {
  return getSaveResult(await apiFetch("/api/peer-groups/join", { method: "POST", body: JSON.stringify({ groupId }) }));
}

export async function renamePeerGroup(groupId: string, groupName: string) {
  return getSaveResult(
    await apiFetch(`/api/peer-groups/${encodeURIComponent(groupId)}`, {
      method: "PATCH",
      body: JSON.stringify({ groupName }),
    }),
  );
}

export async function saveGroupCheckin(groupId: string, week: number, met: boolean, insight: string, nextAction: string) {
  void week; // server tự tính tuần hiện tại (giờ VN) làm nguồn sự thật
  return getSaveResult(
    await apiFetch(`/api/peer-groups/${encodeURIComponent(groupId)}/checkins`, {
      method: "POST",
      body: JSON.stringify({ met, insight, nextAction }),
    }),
  );
}

// --- Coaching -------------------------------------------------------------------------
export async function registerCoaching(explorationGoal: string) {
  return getSaveResult(await apiFetch("/api/coaching/requests", { method: "POST", body: JSON.stringify({ explorationGoal }) }));
}

export async function bookCoachingSlot(slotId: string) {
  return getSaveResult(await apiFetch("/api/coaching/bookings", { method: "POST", body: JSON.stringify({ slotId }) }));
}

// --- Push ------------------------------------------------------------------------------
export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  return getSaveResult(
    await apiFetch("/api/push/subscriptions", {
      method: "POST",
      body: JSON.stringify({ subscription, userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent }),
    }),
  );
}

export async function removePushSubscription(endpoint: string) {
  return getSaveResult(await apiFetch("/api/push/subscriptions", { method: "DELETE", body: JSON.stringify({ endpoint }) }));
}

export function isRemoteApiConfigured() {
  return true;
}

// --- Form public (mới thêm cho các trang /peer, /workshop-evaluation, /final-survey) ----
export async function getPeerAssessment(targetUserId: string) {
  const remote = await apiFetch(`/api/peer/assessment?targetUserId=${encodeURIComponent(targetUserId)}`);
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Không tải được form đánh giá." };
  return { ok: true as const, targetUser: remote.targetUser, questions: remote.questions };
}

export async function checkPeerAssessmentEmail(targetUserId: string, respondentEmail: string, templateId?: string) {
  const remote = await apiFetch("/api/peer/assessment/check-email", {
    method: "POST",
    body: JSON.stringify({ targetUserId, respondentEmail, templateId }),
  });
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Không kiểm tra được email." };
  return { ok: true as const, duplicate: Boolean(remote.duplicate) };
}

export async function savePeerAssessment(data: {
  targetUserId: string;
  respondentEmail: string;
  templateId?: string;
  answers: Record<string, string>;
}) {
  const remote = await apiFetch("/api/peer/assessment", { method: "POST", body: JSON.stringify(data) });
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Chưa gửi được đánh giá.", code: remote?.code };
  return { ok: true as const, responseId: remote.responseId };
}

export async function getPublicWorkshopEvaluation(params: { templateId?: string; workshopId?: string; sessionType?: string; cohortId?: string } = {}) {
  const q = new URLSearchParams();
  if (params.templateId) q.set("templateId", params.templateId);
  if (params.workshopId) q.set("workshopId", params.workshopId);
  if (params.sessionType) q.set("sessionType", params.sessionType);
  if (params.cohortId) q.set("cohortId", params.cohortId);
  const remote = await apiFetch(`/api/public/workshop-evaluation?${q.toString()}`);
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Chưa có form đánh giá đang mở." };
  return { ok: true as const, template: remote.template, evaluationQuestions: remote.evaluationQuestions };
}

export async function savePublicWorkshopEvaluation(data: {
  templateId: string;
  workshopId?: string;
  sessionType?: string;
  cohortId?: string;
  answers: Record<string, string>;
}) {
  const remote = await apiFetch("/api/public/workshop-evaluation", { method: "POST", body: JSON.stringify(data) });
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Chưa gửi được đánh giá." };
  return { ok: true as const, responseId: remote.responseId };
}

export async function getPublicFinalSurvey() {
  const remote = await apiFetch("/api/public/final-survey");
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Khảo sát chưa được mở." };
  return { ok: true as const, template: remote.template, evaluationQuestions: remote.evaluationQuestions };
}

export async function savePublicFinalSurvey(answers: Record<string, string>, cohortId?: string) {
  const remote = await apiFetch("/api/public/final-survey", { method: "POST", body: JSON.stringify({ answers, cohortId }) });
  if (!remote?.ok) return { ok: false as const, error: remote?.error || "Chưa gửi được khảo sát." };
  return { ok: true as const, responseId: remote.responseId };
}
