// ============================================================================
// /api/admin/templates/[id] — Sửa template: bật/tắt, mở quiz... (thay sửa sheet)
// ----------------------------------------------------------------------------
// ADMIN ONLY.
// PATCH { title?, status?, isOpen?, durationMinutes?, maxAttempts?, passScore?, ... }
//       -> bật/tắt form cho học viên (status active|locked, isOpen cho quiz).
// DELETE -> xóa template (bị chặn nếu đã có bài nộp — RESTRICT).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";

const VALID_STATUS = ["active", "locked"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const db = getServiceSupabase();
    const { data: current } = await db.from("evaluation_templates").select("id").eq("id", id).single();
    if (!current) return fail("Không tìm thấy template.", 404, "NOT_FOUND");

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = optString(body.title, 200);
    if (body.description !== undefined) patch.description = optString(body.description, 2000) || null;
    if (body.instructions !== undefined) patch.instructions = optString(body.instructions, 2000) || null;
    if (body.formUrl !== undefined) patch.form_url = optString(body.formUrl, 500) || null;
    if (body.workshopId !== undefined) patch.workshop_id = optString(body.workshopId, 20) || null;
    if (body.sessionType !== undefined) patch.session_type = optString(body.sessionType, 20) || null;
    if (body.cohortId !== undefined) patch.cohort_id = optString(body.cohortId, 20) || null;
    if (body.status !== undefined) {
      const status = optString(body.status, 20);
      if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");
      patch.status = status;
    }
    if (body.isOpen !== undefined) patch.is_open = body.isOpen === true;
    if (body.durationMinutes !== undefined) patch.duration_minutes = Number(body.durationMinutes) || null;
    if (body.maxAttempts !== undefined) patch.max_attempts = Number(body.maxAttempts) || null;
    if (body.passScore !== undefined) patch.pass_score = Number(body.passScore) || null;

    const { data, error } = await db.from("evaluation_templates").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return ok({ template: data });
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = getServiceSupabase();
    const { error } = await db.from("evaluation_templates").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return fail("Không thể xóa vì đã có bài nộp cho form này.", 409, "HAS_REFERENCES");
      }
      throw error;
    }
    return ok({ deleted: id });
  });
}
