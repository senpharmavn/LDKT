// ============================================================================
// POST /api/coaching/requests — Đăng ký Coaching 1:1 (thay registerCoaching)
// ----------------------------------------------------------------------------
// Body: { explorationGoal }.
// Quy tắc (giữ nguyên bản cũ):
//  - Chỉ mở đăng ký khi workshop WS7 (order 7) đang ở trạng thái 'now'.
//  - Mỗi học viên chỉ có 1 đăng ký đang hoạt động.
//  - Admin sẽ chọn (select) sau; được chọn mới đặt lịch (bookings).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const explorationGoal = reqString(body.explorationGoal, "mục tiêu khám phá", 2000);

    const db = getServiceSupabase();

    // Kiểm tra WS7 đang 'now' (đăng ký mở)
    const { data: ws7 } = await db.from("workshops").select("id, status").or("id.eq.WS7,sort_order.eq.7").limit(5);
    const isOpen = (ws7 || []).some((w) => w.status === "now");
    if (!isOpen) return fail("Đăng ký Coaching 1:1 online đã đóng.", 403, "COACHING_CLOSED");

    // Đã có request đang hoạt động?
    const { data: existing } = await db
      .from("coaching_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .not("status", "in", "(withdrawn,not_selected)")
      .limit(1);
    if (existing?.length) {
      return ok({ mode: "existing", requestId: existing[0].id, status: existing[0].status });
    }

    const { data, error } = await db
      .from("coaching_requests")
      .insert({ user_id: user.id, cohort_id: user.profile.cohort_id, exploration_goal: explorationGoal, status: "registered" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return fail("Bạn đã đăng ký coaching rồi.", 409, "ALREADY_REGISTERED");
      throw error;
    }

    return ok({ mode: "inserted", requestId: data.id });
  });
}

// DELETE /api/coaching/requests — Rút đăng ký coaching
export async function DELETE() {
  return handle(async () => {
    const user = await requireUser();
    const db = getServiceSupabase();
    const { error } = await db
      .from("coaching_requests")
      .update({ status: "withdrawn" })
      .eq("user_id", user.id)
      .not("status", "in", "(withdrawn,not_selected,booked)");
    if (error) throw error;
    return ok({ withdrawn: true });
  });
}
