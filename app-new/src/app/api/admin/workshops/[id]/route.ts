// ============================================================================
// /api/admin/workshops/[id] — Sửa / xóa workshop (thay sửa sheet tay)
// ----------------------------------------------------------------------------
// ADMIN ONLY.
// PATCH  { title?, description?, sortOrder?, status?, flashcardUrl?, sessionDate?, cohortId? }
//        -> status 'now' vẫn giữ quy tắc 1-workshop-duy-nhất.
// DELETE -> xóa (bị chặn nếu còn challenge/con liên quan — RESTRICT ở DB).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";

const VALID_STATUS = ["draft", "done", "now", "locked"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const db = getServiceSupabase();
    const { data: current } = await db.from("workshops").select("id, status").eq("id", id).single();
    if (!current) return fail("Không tìm thấy workshop.", 404, "NOT_FOUND");

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = optString(body.title, 200) || current.id;
    if (body.description !== undefined) patch.description = optString(body.description, 2000) || null;
    if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder) || 0;
    if (body.flashcardUrl !== undefined) patch.flashcard_url = optString(body.flashcardUrl, 500) || null;
    if (body.sessionDate !== undefined) patch.session_date = optString(body.sessionDate, 10) || null;
    if (body.cohortId !== undefined) patch.cohort_id = optString(body.cohortId, 20) || null;
    if (body.status !== undefined) {
      const status = optString(body.status, 20);
      if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");
      if (status === "now" && current.status !== "now") {
        const { data: existingNow } = await db.from("workshops").select("id").eq("status", "now").neq("id", id).limit(1);
        if (existingNow?.length) {
          return fail(`Đã có workshop ${existingNow[0].id} đang diễn ra.`, 409, "MULTIPLE_NOW");
        }
      }
      patch.status = status;
    }

    const { data, error } = await db.from("workshops").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return ok({ workshop: data });
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = getServiceSupabase();
    const { error } = await db.from("workshops").delete().eq("id", id);
    if (error) {
      // FK RESTRICT: còn challenge/template tham chiếu
      if (error.code === "23503") {
        return fail("Không thể xóa vì còn thử thách hoặc form đánh giá đang dùng workshop này.", 409, "HAS_REFERENCES");
      }
      throw error;
    }
    return ok({ deleted: id });
  });
}
