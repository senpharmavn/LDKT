// ============================================================================
// POST /api/coaching/bookings — Đặt lịch coaching (thay bookCoachingSlot)
// ----------------------------------------------------------------------------
// Body: { slotId }.
// Quy tắc (giữ nguyên bản cũ):
//  - Học viên phải có request ở trạng thái 'selected' (được admin chọn).
//  - Slot phải tồn tại và đang 'open'.
//  - Chống 2 người đặt trùng 1 slot: UNIQUE(slot_id) + kiểm tra trước khi chèn.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const slotId = reqString(body.slotId, "mã khung giờ", 60);

    const db = getServiceSupabase();

    // Phải được admin chọn trước
    const { data: requestRow } = await db
      .from("coaching_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "selected")
      .limit(1)
      .maybeSingle();
    if (!requestRow) return fail("Bạn chưa được chọn coaching.", 403, "NOT_SELECTED");

    const { data: slot } = await db.from("coaching_slots").select("id, status").eq("id", slotId).single();
    if (!slot) return fail("Không tìm thấy khung giờ coaching.", 404, "SLOT_NOT_FOUND");
    if (slot.status !== "open") return fail("Khung giờ này vừa được đăng ký.", 409, "SLOT_TAKEN");

    // Tạo booking (UNIQUE(slot_id) chống đua) + đánh dấu slot + request
    const { data: booking, error } = await db
      .from("coaching_bookings")
      .insert({ slot_id: slotId, user_id: user.id, request_id: requestRow.id, status: "confirmed" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return fail("Khung giờ này vừa được đăng ký.", 409, "SLOT_TAKEN");
      throw error;
    }

    await db.from("coaching_slots").update({ status: "booked" }).eq("id", slotId);
    await db.from("coaching_requests").update({ status: "booked" }).eq("id", requestRow.id);

    return ok({ mode: "booked", bookingId: booking.id, slotId });
  });
}
