// ============================================================================
// /api/admin/templates — Quản lý form đánh giá / quiz (thay sửa sheet tay)
// ----------------------------------------------------------------------------
// ADMIN ONLY.
// GET  -> danh sách template (kèm số câu hỏi).
// POST { id?, type, title, workshopId?, status?, isOpen?, durationMinutes?,
//        maxAttempts?, passScore?, formUrl?, description?, cohortId? }
//      -> type: workshop|self_before|other_before|final_quiz|final_survey.
//      -> status: active|locked (mặc định locked = fail-close).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqString } from "@/lib/validators";

const VALID_TYPES = ["workshop", "self_before", "other_before", "final_quiz", "final_survey"];
const VALID_STATUS = ["active", "locked"];

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = getServiceSupabase();
    const { data: templates } = await db.from("evaluation_templates").select("*").order("id");
    const { data: questions } = await db.from("evaluation_questions").select("template_id");
    const countBy = new Map<string, number>();
    for (const q of questions || []) countBy.set(q.template_id, (countBy.get(q.template_id) || 0) + 1);
    return ok({
      templates: (templates || []).map((t) => ({ ...t, questionCount: countBy.get(t.id) || 0 })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const id = reqString(body.id, "mã template", 40).toUpperCase();
    const type = reqString(body.type, "loại form", 20);
    if (!VALID_TYPES.includes(type)) return fail(`Loại form không hợp lệ: ${type}.`, 400, "INVALID_TYPE");
    const title = reqString(body.title, "tiêu đề", 200);
    const status = optString(body.status, 20) || "locked";
    if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");

    const db = getServiceSupabase();
    const { data, error } = await db
      .from("evaluation_templates")
      .insert({
        id,
        type,
        workshop_id: optString(body.workshopId, 20) || null,
        session_type: optString(body.sessionType, 20) || null,
        title,
        description: optString(body.description, 2000) || null,
        status,
        is_open: body.isOpen === true,
        form_url: optString(body.formUrl, 500) || null,
        duration_minutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) || null : null,
        max_attempts: body.maxAttempts !== undefined ? Number(body.maxAttempts) || null : null,
        pass_score: body.passScore !== undefined ? Number(body.passScore) || null : null,
        instructions: optString(body.instructions, 2000) || null,
        cohort_id: optString(body.cohortId, 20) || null,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return fail(`Template ${id} đã tồn tại.`, 409, "DUPLICATE_ID");
      throw error;
    }
    return ok({ template: data }, 201);
  });
}
