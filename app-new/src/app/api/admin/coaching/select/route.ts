// ============================================================================
// POST /api/admin/coaching/select — Chọn học viên được coaching
// (thay selectCoachingCandidates)
// ----------------------------------------------------------------------------
// ADMIN ONLY. Body: { requestIds: string[], selected?: boolean }
// Đánh dấu các request 'registered' -> 'selected' (hoặc 'not_selected' nếu
// selected=false). Chỉ admin được gọi.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const requestIds = (body.requestIds || []) as unknown[];
    if (!Array.isArray(requestIds) || !requestIds.length) {
      return fail("Thiếu danh sách request.", 400, "MISSING_REQUEST_IDS");
    }
    const selected = body.selected !== false;
    const nextStatus = selected ? "selected" : "not_selected";

    const db = getServiceSupabase();
    const { data, error } = await db
      .from("coaching_requests")
      .update({ status: nextStatus })
      .in("id", requestIds.map(String))
      .eq("status", "registered")
      .select("id");
    if (error) throw error;

    return ok({ updated: (data || []).length, status: nextStatus });
  });
}
