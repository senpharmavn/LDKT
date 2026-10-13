// ============================================================================
// POST /api/evaluations/responses — Nộp bài đánh giá theo form (thay saveEvaluationResponse)
// ----------------------------------------------------------------------------
// Body: { templateId, workshopId?, sessionType?, answers: Record<questionId, value> }
// - Template phải tồn tại, status='active' (fail-close).
// - Validate đủ câu bắt buộc theo evaluation_questions.
// - Upsert response theo (user, template); ghi lại toàn bộ answers.
// - Template self (không gắn workshop) -> +20 XP khi nộp lần đầu.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { getQuestionsForTemplate } from "@/lib/evaluationQuestions";
import { hasAnswerValue, normalizeScenarioAnswer, optString, reqString } from "@/lib/validators";
import { awardXp } from "@/lib/xp";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const templateId = reqString(body.templateId, "mã form đánh giá", 40);
    const answers = (body.answers || {}) as Record<string, unknown>;
    const workshopId = optString(body.workshopId, 20);
    const sessionType = optString(body.sessionType, 20);

    const db = getServiceSupabase();

    const { data: template } = await db.from("evaluation_templates").select("*").eq("id", templateId).single();
    if (!template) {
      return fail("Form đánh giá không hợp lệ hoặc đã thay đổi. Vui lòng tải lại form.", 404, "INVALID_EVALUATION_TEMPLATE");
    }
    // Fail-close: chỉ template active MỚI nhận bài
    if (template.status !== "active") {
      return fail("Form đánh giá này hiện đang đóng.", 403, "TEMPLATE_LOCKED");
    }

    // Validate cau bat buoc — GOP ngan hang cau hoi chung (COMMON/SELF-COMMON/PEER-COMMON)
    // giong hanh vi ban cu.
    const questions = await getQuestionsForTemplate<{ question_id: string; question_type: string; is_required: boolean; options: string | null }>(
      db,
      { id: template.id, type: template.type },
      "question_id, question_type, is_required, options",
    );

    const missing = (questions || [])
      .filter((q) => q.is_required && !hasAnswerValue(answers, q.question_id))
      .map((q) => q.question_id);
    if (missing.length) {
      return fail(`Còn ${missing.length} câu bắt buộc chưa trả lời. Vui lòng hoàn thành form.`, 400, "MISSING_REQUIRED_ANSWERS");
    }

    // Upsert response theo (user, template)
    const { data: existing } = await db
      .from("evaluation_responses")
      .select("id")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .maybeSingle();

    const now = new Date().toISOString();
    const responsePayload = {
      user_id: user.id,
      template_id: templateId,
      metadata: { workshopId: workshopId || template.workshop_id || "", sessionType, respondentType: "self" },
      submitted_at: now,
    };

    let responseId: string;
    let isNew = false;
    if (existing) {
      const { error } = await db.from("evaluation_responses").update(responsePayload).eq("id", existing.id);
      if (error) throw error;
      responseId = existing.id;
      await db.from("evaluation_answers").delete().eq("response_id", responseId);
    } else {
      const { data, error } = await db.from("evaluation_responses").insert(responsePayload).select("id").single();
      if (error) throw error;
      responseId = data.id;
      isNew = true;
    }

    // Ghi answers (chuẩn hoá single_choice về reactive/creative)
    const qMap = new Map((questions || []).map((q) => [q.question_id, q]));
    const answerRows = Object.keys(answers)
      .filter((qid) => hasAnswerValue(answers, qid))
      .map((qid) => {
        const q = qMap.get(qid);
        const raw = answers[qid];
        const isMulti = q?.question_type === "multiple_choice";
        const values = Array.isArray(raw) ? raw.map((v) => String(v)) : [String(raw ?? "")];
        const num = Number(raw);
        return {
          response_id: responseId,
          question_id: qid,
          answer_text:
            q?.question_type === "single_choice" ? normalizeScenarioAnswer(raw) : Array.isArray(raw) ? null : String(raw ?? ""),
          answer_value: !Array.isArray(raw) && Number.isFinite(num) && String(raw).trim() !== "" ? num : null,
          selected_options: isMulti ? values.map((v) => v.trim()).filter(Boolean) : null,
        };
      });
    if (answerRows.length) {
      const { error } = await db.from("evaluation_answers").insert(answerRows);
      if (error) throw error;
    }

    // Tự đánh giá (không gắn workshop cụ thể) -> +20 XP lần đầu
    if (isNew && (template.type === "self_before" || template.type === "self_after") && !template.workshop_id) {
      await awardXp(user.id, "self_evaluation", "evaluation_responses", responseId, `Nộp ${templateId}`);
    }

    return ok({ responseId, mode: existing ? "updated" : "inserted" });
  });
}
