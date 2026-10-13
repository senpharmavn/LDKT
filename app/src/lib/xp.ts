// ============================================================================
// xp.ts — XP engine: MỘT NGUỒN SỰ THẬT DUY NHẤT cho điểm XP
// ----------------------------------------------------------------------------
// Mọi lần cộng XP đều ghi 1 dòng vào bảng xp_events (append-only).
// Tổng XP của user = SUM(xp) — không lưu riêng ở bảng khác để khỏi lệch số
// (lỗi cũ: server tính một kiểu, client tính một kiểu).
//
// Thang điểm (giữ nguyên công thức cũ để không gây sốc cho học viên):
//   checkin hoàn thành      +20
//   check-in nhóm (peer)    +30
//   tự đánh giá (self)      +20
//   điểm danh workshop      +20
// ============================================================================
import { getServiceSupabase } from "./supabaseServer";

export const XP_REWARDS = {
  checkin: 20,
  group_checkin: 30,
  self_evaluation: 20,
  workshop_attendance: 20,
  quiz_pass: 0, // giữ nguyên bản cũ (chưa cộng XP cho quiz)
} as const;

export type XpEventType = keyof typeof XP_REWARDS | "admin_adjust";

/** Ghi 1 dòng cộng XP (append-only). Dùng service client vì RLS cấm user tự ghi. */
export async function awardXp(
  userId: string,
  eventType: XpEventType,
  refTable?: string,
  refId?: string,
  note?: string,
): Promise<void> {
  const xp = eventType in XP_REWARDS ? XP_REWARDS[eventType as keyof typeof XP_REWARDS] : 0;
  if (!xp) return;
  const service = getServiceSupabase();
  const { error } = await service.from("xp_events").insert({
    user_id: userId,
    event_type: eventType,
    xp,
    ref_table: refTable ?? null,
    ref_id: refId ?? null,
    note: note ?? null,
  });
  if (error) console.error("[xp] awardXp failed:", error.message);
}

/** Tổng XP của 1 user. */
export async function getTotalXp(userId: string): Promise<number> {
  const service = getServiceSupabase();
  const { data, error } = await service.from("xp_events").select("xp").eq("user_id", userId);
  if (error) {
    console.error("[xp] getTotalXp failed:", error.message);
    return 0;
  }
  return (data || []).reduce((sum, row) => sum + (Number(row.xp) || 0), 0);
}

/** Tổng XP của nhiều user trong 1 query (cho leaderboard). */
export async function getTotalXpBatch(userIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!userIds.length) return result;
  const service = getServiceSupabase();
  const { data, error } = await service.from("xp_events").select("user_id, xp").in("user_id", userIds);
  if (error) {
    console.error("[xp] getTotalXpBatch failed:", error.message);
    return result;
  }
  for (const row of data || []) {
    result.set(row.user_id, (result.get(row.user_id) || 0) + (Number(row.xp) || 0));
  }
  return result;
}

/**
 * Streak: số ngày LIÊN TỤC có check-in, tính ngược từ hôm nay
 * (hôm nay chưa check-in thì tính từ hôm qua — định nghĩa duy nhất toàn hệ thống).
 */
export function calculateStreak(checkinDates: string[]): number {
  const days = new Set(checkinDates);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  // Mốc VN: lấy "hôm nay" theo Asia/Ho_Chi_Minh
  const vnNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  let cursor = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
  // Nếu hôm nay chưa check-in, bắt đầu đếm từ hôm qua
  if (!days.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(fmt(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Chuỗi ngày dài nhất từng đạt (giữ để tương thích hiển thị cũ). */
export function calculateLongestStreak(checkinDates: string[]): number {
  const sorted = [...new Set(checkinDates)].sort();
  let longest = 0;
  let current = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev) {
      const diff = (new Date(day).getTime() - new Date(prev).getTime()) / 86_400_000;
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prev = day;
  }
  return longest;
}
