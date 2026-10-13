// ============================================================================
// POST /api/peer-groups/[groupId]/checkins — Check-in nhóm theo tuần
// (thay saveGroupCheckin)
// ----------------------------------------------------------------------------
// Body: { week, met?, insight?, nextAction? }.
// - Phải là thành viên nhóm. Mỗi (nhóm, user, tuần) chỉ 1 check-in.
// - Check-in nhóm mới -> +30 XP.
// LƯU Ý: schema dùng week_start (DATE) thay vì số tuần; ở đây quy ước
// week_start = thứ Hai của tuần hiện tại theo giờ VN.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";
import { awardXp } from "@/lib/xp";

/** Thứ Hai của tuần hiện tại (giờ VN), định dạng yyyy-MM-dd. */
function currentWeekStart(): string {
  const vn = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const day = vn.getDay(); // 0=CN
  const diff = (day + 6) % 7; // số ngày lùi về thứ Hai
  vn.setDate(vn.getDate() - diff);
  return `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, "0")}-${String(vn.getDate()).padStart(2, "0")}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const met = body.met !== false;
    const insight = optString(body.insight, 2000);
    const nextAction = optString(body.nextAction, 2000);
    const weekStart = currentWeekStart();

    const db = getServiceSupabase();
    const { data: membership } = await db
      .from("peer_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return fail("Bạn không phải thành viên của nhóm này.", 403, "NOT_A_MEMBER");

    const { data: existing } = await db
      .from("group_checkins")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (existing) return fail("Bạn đã check-in nhóm trong tuần này.", 409, "ALREADY_CHECKED_IN");

    const content = [met ? "Đã gặp" : "Chưa gặp", insight, nextAction].filter(Boolean).join(" | ");
    const { data, error } = await db
      .from("group_checkins")
      .insert({ group_id: groupId, user_id: user.id, week_start: weekStart, content })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return fail("Bạn đã check-in nhóm trong tuần này.", 409, "ALREADY_CHECKED_IN");
      throw error;
    }

    await awardXp(user.id, "group_checkin", "group_checkins", data.id, `Check-in nhóm ${groupId}`);
    return ok({ checkinId: data.id, weekStart, mode: "inserted" });
  });
}
