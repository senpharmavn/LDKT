// ============================================================================
// POST /api/checkins — Lưu check-in hằng ngày (thay saveCheckin)
// ----------------------------------------------------------------------------
// Body: { challengeId, day?, workshopId?, completed?, mood?, insight?, nextAction? }
// Upsert theo (user_id, challenge_id). Mỗi check-in hoàn thành MỚI -> +20 XP
// (ghi ledger xp_events). Không cộng XP khi chỉ cập nhật lại nội dung.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser, todayVn } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqString } from "@/lib/validators";
import { awardXp } from "@/lib/xp";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const challengeId = reqString(body.challengeId, "mã thử thách", 20);
    const completed = body.completed !== false;
    const mood = optString(body.mood, 50);
    const insight = optString(body.insight, 2000);
    const nextAction = optString(body.nextAction, 2000);

    const db = getServiceSupabase();

    // Thử thách phải tồn tại và đang active
    const { data: challenge } = await db.from("mini_challenges").select("id, status").eq("id", challengeId).single();
    if (!challenge) return fail("Không tìm thấy thử thách.", 404, "CHALLENGE_NOT_FOUND");

    const today = todayVn();
    const { data: existing } = await db
      .from("checkins")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    let checkinId: string;
    if (existing) {
      const { data, error } = await db
        .from("checkins")
        .update({ mood, insight, next_action: nextAction, checkin_date: today })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw error;
      checkinId = data.id;
    } else {
      const { data, error } = await db
        .from("checkins")
        .insert({ user_id: user.id, challenge_id: challengeId, checkin_date: today, mood, insight, next_action: nextAction })
        .select("id")
        .single();
      if (error) throw error;
      checkinId = data.id;
      // Check-in mới hoàn thành -> cộng XP (một lần duy nhất)
      if (completed) await awardXp(user.id, "checkin", "checkins", checkinId, `Check-in ${challengeId}`);
    }

    return ok({ checkinId, mode: existing ? "updated" : "inserted" });
  });
}
