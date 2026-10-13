// ============================================================================
// POST /api/quiz/submit — Nộp bài thi (thay submitFinalQuiz)
// ----------------------------------------------------------------------------
// Body: { templateId?, answers: Record<questionId, value> }.
// - Attempt phải đang in_progress (chưa nộp).
// - Bắt buộc trả lời TẤT CẢ câu hỏi (giữ nguyên quy tắc cũ).
// - Chấm trắc nghiệm tự động: 10 câu đầu có answer_key × 7đ (giữ nguyên).
// - Câu tự luận để giảng viên chấm sau (essay).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { hasAnswerValue, optString } from "@/lib/validators";
import { gradeObjective } from "@/lib/quiz";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const templateId = optString(body.templateId, 40) || "FINALQUIZ";
    const answers = (body.answers || {}) as Record<string, unknown>;

    const db = getServiceSupabase();

    const { data: attempt } = await db
      .from("evaluation_responses")
      .select("id, submitted_at, metadata")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .is("submitted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!attempt) return fail("Bạn chưa bắt đầu bài kiểm tra hoặc bài đã được nộp.", 400, "NO_ACTIVE_ATTEMPT");

    const { data: questions } = await db
      .from("evaluation_questions")
      .select("question_id, question_type, answer_key, sort_order")
      .eq("template_id", templateId)
      .order("sort_order");

    const missing = (questions || []).filter((q) => !hasAnswerValue(answers, q.question_id));
    if (missing.length) {
      return fail(`Còn ${missing.length} câu chưa trả lời. Vui lòng hoàn thành đủ bài kiểm tra trước khi nộp.`, 400, "MISSING_ANSWERS");
    }

    // Chấm trắc nghiệm tự động (10 câu × 7đ)
    const { objectiveScore, details } = gradeObjective(
      (questions || []).map((q) => ({ question_id: q.question_id, question_type: q.question_type, answer_key: q.answer_key })),
      answers,
    );
    const detailMap = new Map(details.map((d) => [d.question_id, d]));

    // Lưu từng câu trả lời
    const answerRows = (questions || []).map((q) => {
      const d = detailMap.get(q.question_id);
      const raw = answers[q.question_id];
      const num = Number(raw);
      return {
        response_id: attempt.id,
        question_id: q.question_id,
        answer_text: Array.isArray(raw) ? null : String(raw ?? ""),
        answer_value: !Array.isArray(raw) && Number.isFinite(num) && String(raw).trim() !== "" ? num : null,
        selected_options: Array.isArray(raw) ? raw.map((v) => String(v)) : null,
        is_correct: d ? d.is_correct : null,
        points: d ? d.points : 0,
      };
    });
    const { error: ansError } = await db.from("evaluation_answers").insert(answerRows);
    if (ansError) throw ansError;

    const now = new Date().toISOString();
    const { error: updError } = await db
      .from("evaluation_responses")
      .update({
        submitted_at: now,
        score: objectiveScore,
        metadata: { ...(attempt.metadata || {}), kind: "quiz", gradingStatus: "pending", objectiveScore },
      })
      .eq("id", attempt.id);
    if (updError) throw updError;

    return ok({
      attempt: {
        attemptId: attempt.id,
        templateId,
        status: "submitted",
        submittedAt: now,
        objectiveScore,
        gradingStatus: "pending",
      },
    });
  });
}
