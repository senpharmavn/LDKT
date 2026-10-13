// ============================================================================
// /api/admin/workshops — Quản lý workshop (thay việc sửa sheet Workshops tay)
// ----------------------------------------------------------------------------
// ADMIN ONLY.
// GET    -> danh sách workshop (kèm số người điểm danh).
// POST   { id?, title, description?, sortOrder?, status?, flashcardUrl?, sessionDate?, cohortId? }
//        -> tạo mới (id dạng 'WS8' hoặc tự sinh).
// Quy tắc: status 'now' (đang diễn ra) chỉ được 1 workshop tại 1 thời điểm.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqString } from "@/lib/validators";

const VALID_STATUS = ["draft", "done", "now", "locked"];

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = getServiceSupabase();
    const { data: workshops } = await db.from("workshops").select("*").order("sort_order");
    const { data: attendance } = await db.from("workshop_attendance").select("workshop_id");
    const countBy = new Map<string, number>();
    for (const a of attendance || []) countBy.set(a.workshop_id, (countBy.get(a.workshop_id) || 0) + 1);
    return ok({
      workshops: (workshops || []).map((w) => ({ ...w, attendeeCount: countBy.get(w.id) || 0 })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const title = reqString(body.title, "tên workshop", 200);
    const status = optString(body.status, 20) || "draft";
    if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");

    const db = getServiceSupabase();
    if (status === "now") {
      // Chỉ 1 workshop 'now' tại 1 thời điểm
      const { data: existingNow } = await db.from("workshops").select("id").eq("status", "now").limit(1);
      if (existingNow?.length) {
        return fail(`Đã có workshop ${existingNow[0].id} đang diễn ra. Hãy chuyển nó sang 'done' trước.`, 409, "MULTIPLE_NOW");
      }
    }

    const id = optString(body.id, 20).toUpperCase() || `WS${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await db
      .from("workshops")
      .insert({
        id,
        title,
        description: optString(body.description, 2000) || null,
        sort_order: Number(body.sortOrder) || 0,
        status,
        flashcard_url: optString(body.flashcardUrl, 500) || null,
        session_date: optString(body.sessionDate, 10) || null,
        cohort_id: optString(body.cohortId, 20) || null,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return fail(`Mã workshop ${id} đã tồn tại.`, 409, "DUPLICATE_ID");
      throw error;
    }
    return ok({ workshop: data }, 201);
  });
}
