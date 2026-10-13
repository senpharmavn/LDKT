// ============================================================================
// GET /api/admin/dashboard — Số liệu tổng hợp cho giảng viên (thay
// getInstructorDashboard ở mức cơ bản; dashboard chi tiết sẽ mở rộng sau)
// ----------------------------------------------------------------------------
// ADMIN ONLY. Trả về: tổng quan user/checkin, thống kê theo workshop,
// leaderboard toàn cohort, request coaching chờ duyệt, quiz chưa chấm.
// ============================================================================
import { NextRequest } from "next/server";
import { handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { getInitials } from "@/lib/dashboard";
import { getTotalXpBatch } from "@/lib/xp";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const admin = await requireAdmin();
    const cohortId = request.nextUrl.searchParams.get("cohortId") || admin.profile.cohort_id;
    const db = getServiceSupabase();


    // Học viên
    let profilesQ = db.from("profiles").select("id, student_code, full_name, cohort_id, status").eq("status", "active");
    if (cohortId) profilesQ = profilesQ.eq("cohort_id", cohortId);
    const { data: profiles } = await profilesQ.limit(500);
    const userIds = (profiles || []).map((p) => p.id);

    // Check-in
    const { count: checkinCount } = await db.from("checkins").select("id", { count: "exact", head: true }).in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    // Thống kê theo workshop (điểm danh)
    const { data: workshops } = await db.from("workshops").select("id, title, sort_order").order("sort_order");
    const { data: attendance } = await db.from("workshop_attendance").select("workshop_id, user_id");
    const attendByWs = new Map<string, number>();
    for (const a of attendance || []) attendByWs.set(a.workshop_id, (attendByWs.get(a.workshop_id) || 0) + 1);

    // Quiz chờ chấm (submitted nhưng chưa graded/published)
    const { data: pendingQuiz } = await db
      .from("evaluation_responses")
      .select("id, user_id, template_id, submitted_at, profiles!inner(student_code, full_name)")
      .eq("template_id", "FINALQUIZ")
      .not("submitted_at", "is", null)
      .neq("metadata->>gradingStatus", "published")
      .limit(50);

    // Request coaching chờ duyệt
    const { data: coachingPending } = await db
      .from("coaching_requests")
      .select("id, user_id, exploration_goal, requested_at, profiles!inner(student_code, full_name)")
      .eq("status", "registered")
      .order("requested_at")
      .limit(50);

    // Leaderboard top 20
    const xpMap = await getTotalXpBatch(userIds);
    const leaderboard = (profiles || [])
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

    return ok({
      overview: {
        totalStudents: (profiles || []).length,
        totalCheckins: checkinCount || 0,
        pendingQuizCount: (pendingQuiz || []).length,
        pendingCoachingCount: (coachingPending || []).length,
      },
      workshops: (workshops || []).map((w) => ({ id: w.id, title: w.title, attendees: attendByWs.get(w.id) || 0 })),
      leaderboard,
      pendingQuiz: (pendingQuiz || []).map((r) => ({
        attemptId: r.id,
        studentCode: (r as unknown as { profiles: { student_code: string; full_name: string } }).profiles.student_code,
        fullName: (r as unknown as { profiles: { student_code: string; full_name: string } }).profiles.full_name,
        submittedAt: r.submitted_at,
      })),
      pendingCoaching: (coachingPending || []).map((r) => ({
        requestId: r.id,
        studentCode: (r as unknown as { profiles: { student_code: string; full_name: string } }).profiles.student_code,
        fullName: (r as unknown as { profiles: { student_code: string; full_name: string } }).profiles.full_name,
        explorationGoal: r.exploration_goal,
        requestedAt: r.requested_at,
      })),
    });
  });
}
