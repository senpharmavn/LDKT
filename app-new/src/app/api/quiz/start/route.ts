// ============================================================================
// POST /api/quiz/start — Bắt đầu bài thi cuối khóa (thay startFinalQuiz)
// ----------------------------------------------------------------------------
// Body: { templateId? } (mặc định "FINALQUIZ").
// - Template phải type='final_quiz', status='active' VÀ is_open=true.
// - Giới hạn số lượt theo max_attempts (mặc định 1) — áp ở application layer.
// - Attempt có expiresAt = now + duration_minutes (mặc định 30).
// - Trả về attempt + danh sách câu hỏi (KHÔNG kèm answer_key).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, readMeta, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const templateId = optString(body.templateId, 40) || "FINALQUIZ";

    const db = getServiceSupabase();
    const { data: template } = await db.from("evaluation_templates").select("*").eq("id", templateId).single();
    if (!template || template.type !== "final_quiz") {
      return fail("Không tìm thấy bài kiểm tra.", 404, "TEMPLATE_NOT_FOUND");
    }
    if (template.status !== "active" || !template.is_open) {
      return fail("Bài kiểm tra cuối khóa chưa mở.", 403, "QUIZ_NOT_OPEN");
    }

    // Kiểm tra số lượt đã nộp
    const maxAttempts = template.max_attempts ?? 1;
    const { data: attempts } = await db
      .from("evaluation_responses")
      .select("id, submitted_at, metadata")
      .eq("user_id", user.id)
      .eq("template_id", templateId);
    const submittedCount = (attempts || []).filter((a) => a.submitted_at).length;
    if (submittedCount >= maxAttempts) {
      return fail("Bạn đã nộp bài kiểm tra cuối khóa.", 403, "MAX_ATTEMPTS_REACHED");
    }

    const now = new Date();
    let attempt = (attempts || []).find((a) => !a.submitted_at) || null;
    if (!attempt) {
      const duration = template.duration_minutes ?? 30;
      const { data, error } = await db
        .from("evaluation_responses")
        .insert({
          user_id: user.id,
          template_id: templateId,
          started_at: now.toISOString(),
          metadata: {
            kind: "quiz",
            expiresAt: new Date(now.getTime() + duration * 60_000).toISOString(),
            gradingStatus: "in_progress",
          },
        })
        .select("id, started_at, metadata")
        .single();
      if (error) throw error;
      attempt = data;
    }
    const attemptMeta = readMeta(attempt);

    // Câu hỏi (ẩn answer_key)
    const { data: questions } = await db
      .from("evaluation_questions")
      .select("question_id, question_text, question_type, options, sort_order, is_required")
      .eq("template_id", templateId)
      .order("sort_order");

    return ok({
      attempt: {
        attemptId: attempt.id,
        templateId,
        status: "in_progress",
        startedAt: attempt.started_at,
        expiresAt: (attemptMeta.expiresAt as string) || "",
      },
      questions: (questions || []).map((q) => ({
        id: q.question_id,
        templateId,
        order: q.sort_order,
        text: q.question_text,
        type: q.question_type,
        options: (q.options || "").split(/\s*\|\s*/).map((s: string) => s.trim()).filter(Boolean),
        required: q.is_required,
        dimension: "",
      })),
    });
  });
}
