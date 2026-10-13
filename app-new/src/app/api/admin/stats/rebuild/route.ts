// ============================================================================
// POST /api/admin/stats/rebuild — Tính lại stats_daily (thay rebuildStudentStats)
// ----------------------------------------------------------------------------
// ADMIN ONLY (hoặc CRON_SECRET cho cron đêm). Body: { userId? } — không có
// userId thì rebuild toàn bộ (cẩn thận khi đông user).
// Tính cho mỗi user: xp_total (SUM xp_events), checkin_count, streak_days
// (định nghĩa duy nhất), rank_in_cohort. Ghi đè dòng stats_daily của hôm nay.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret, fail, handle, ok, requireAdmin, todayVn } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { calculateStreak } from "@/lib/xp";

export async function POST(request: NextRequest) {
  return handle(async () => {
    // Cho phép cron gọi bằng CRON_SECRET, hoặc admin đăng nhập
    if (!checkCronSecret(request)) {
      try {
        await requireAdmin();
      } catch (e) {
        if (e instanceof Response) return e;
        throw e;
      }
    }

    const body = await request.json().catch(() => ({}));
    const onlyUserId = typeof body.userId === "string" ? body.userId : null;
    const date = todayVn();
    const db = getServiceSupabase();

    let profileQuery = db.from("profiles").select("id, cohort_id").eq("status", "active");
    if (onlyUserId) profileQuery = profileQuery.eq("id", onlyUserId);
    const { data: profiles } = await profileQuery.limit(1000);
    if (!profiles?.length) return ok({ rebuilt: 0, date });

    const userIds = profiles.map((p) => p.id);

    // XP + checkin dates theo user
    const { data: xpRows } = await db.from("xp_events").select("user_id, xp").in("user_id", userIds);
    const xpByUser = new Map<string, number>();
    for (const r of xpRows || []) xpByUser.set(r.user_id, (xpByUser.get(r.user_id) || 0) + Number(r.xp || 0));

    const { data: checkinRows } = await db.from("checkins").select("user_id, checkin_date").in("user_id", userIds);
    const datesByUser = new Map<string, string[]>();
    for (const r of checkinRows || []) {
      const arr = datesByUser.get(r.user_id) || [];
      arr.push(r.checkin_date);
      datesByUser.set(r.user_id, arr);
    }

    // Rank theo cohort
    const byCohort = new Map<string, { id: string; xp: number }[]>();
    for (const p of profiles) {
      const key = p.cohort_id || "__global__";
      const arr = byCohort.get(key) || [];
      arr.push({ id: p.id, xp: xpByUser.get(p.id) || 0 });
      byCohort.set(key, arr);
    }
    const rankByUser = new Map<string, number>();
    for (const arr of byCohort.values()) {
      arr.sort((a, b) => b.xp - a.xp);
      arr.forEach((u, i) => rankByUser.set(u.id, i + 1));
    }

    const rows = profiles.map((p) => {
      const dates = datesByUser.get(p.id) || [];
      return {
        user_id: p.id,
        stat_date: date,
        xp_total: xpByUser.get(p.id) || 0,
        checkin_count: dates.length,
        streak_days: calculateStreak(dates),
        rank_in_cohort: rankByUser.get(p.id) || null,
      };
    });

    const { error } = await db.from("stats_daily").upsert(rows, { onConflict: "user_id,stat_date" });
    if (error) throw error;

    return ok({ rebuilt: rows.length, date });
  });
}

// Vercel Cron cũng có thể gọi GET (giữ tương thích cấu hình cron cũ)
export async function GET(request: NextRequest) {
  return POST(request);
}
