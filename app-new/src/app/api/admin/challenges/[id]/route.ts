// ============================================================================
// PATCH /api/admin/challenges/[id] — Sửa challenge (bật/tắt, đổi lịch...)
// DELETE /api/admin/challenges/[id] — Xóa challenge
// ADMIN ONLY. (Thay việc sửa sheet Mini_Challenges tay.)
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";

const VALID_STATUS = ["active", "draft", "archived"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const db = getServiceSupabase();
    const { data: current } = await db.from("mini_challenges").select("id").eq("id", id).single();
    if (!current) return fail("Không tìm thấy challenge.", 404, "NOT_FOUND");

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = optString(body.title, 200);
    if (body.description !== undefined) patch.description = optString(body.description, 2000) || null;
    if (body.instruction !== undefined) patch.instruction = optString(body.instruction, 2000) || null;
    if (body.day !== undefined) patch.day = Number(body.day) || 1;
    if (body.challengeDate !== undefined) patch.challenge_date = optString(body.challengeDate, 10) || null;
    if (body.cohortId !== undefined) patch.cohort_id = optString(body.cohortId, 20) || null;
    if (body.status !== undefined) {
      const status = optString(body.status, 20);
      if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");
      patch.status = status;
    }
    if (body.workshopId !== undefined) {
      const wsId = optString(body.workshopId, 20);
      const { data: ws } = await db.from("workshops").select("id").eq("id", wsId).maybeSingle();
      if (!ws) return fail("Không tìm thấy workshop.", 404, "WORKSHOP_NOT_FOUND");
      patch.workshop_id = wsId;
    }

    const { data, error } = await db.from("mini_challenges").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return ok({ challenge: data });
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = getServiceSupabase();
    const { error } = await db.from("mini_challenges").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return fail("Không thể xóa vì đã có check-in của học viên cho thử thách này.", 409, "HAS_REFERENCES");
      }
      throw error;
    }
    return ok({ deleted: id });
  });
}
