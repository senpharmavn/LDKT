// ============================================================================
// /api/public/final-survey — Khảo sát cuối chương trình (thay
// getPublicFinalSurvey / savePublicFinalSurvey)
// ----------------------------------------------------------------------------
// GET  -> template FINALSURVEY đang active + câu hỏi.
// POST { cohortId?, answers } -> lưu ẩn danh (respondent_token "Anonymous N"),
//      validate câu bắt buộc + logic đồng ý truyền thông (Q9/Q10/Q11).
// Public, rate-limit theo IP.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, getClientIp, handle, ok, rateLimit } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { hasAnswerValue, optString } from "@/lib/validators";

const TEMPLATE_ID = "FINALSURVEY";

function limited(request: NextRequest): boolean {
  return rateLimit(`public-fs:${getClientIp(request)}`, 20, 60_000);
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    if (limited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const db = getServiceSupabase();
    const { data: template } = await db
      .from("evaluation_templates")
      .select("*")
      .eq("id", TEMPLATE_ID)
      .eq("type", "final_survey")
      .eq("status", "active")
      .maybeSingle();
    if (!template) return fail("Khảo sát cuối chương trình chưa được mở.", 404, "SURVEY_NOT_OPEN");

    const { data: questions } = await db
      .from("evaluation_questions")
      .select("question_id, question_text, question_type, options, sort_order, is_required, dimension")
      .eq("template_id", TEMPLATE_ID)
      .order("sort_order");

    return ok({
      template: {
        id: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        status: template.status,
      },
      evaluationQuestions: (questions || []).map((q) => ({
        id: q.question_id,
        templateId: TEMPLATE_ID,
        order: q.sort_order,
        text: q.question_text,
        type: q.question_type,
        options: (q.options || "").split(/\s*\|\s*/).map((s: string) => s.trim()).filter(Boolean),
        required: q.is_required,
        dimension: q.dimension || "",
      })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    if (limited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const body = await request.json().catch(() => ({}));
    const answers = (body.answers || {}) as Record<string, unknown>;
    const cohortId = optString(body.cohortId, 20) || "K002";

    const db = getServiceSupabase();
    const { data: template } = await db
      .from("evaluation_templates")
      .select("id")
      .eq("id", TEMPLATE_ID)
      .eq("type", "final_survey")
      .eq("status", "active")
      .maybeSingle();
    if (!template) return fail("Khảo sát cuối chương trình chưa được mở.", 404, "SURVEY_NOT_OPEN");

    const { data: questions } = await db
      .from("evaluation_questions")
      .select("question_id, is_required")
      .eq("template_id", TEMPLATE_ID);
    const missing = (questions || []).filter((q) => q.is_required && !hasAnswerValue(answers, q.question_id));
    if (missing.length) return fail("Vui lòng trả lời đầy đủ các câu bắt buộc.", 400, "MISSING_REQUIRED_ANSWERS");

    // Logic đồng ý truyền thông (giữ nguyên bản cũ: Q9 -> Q10/Q11)
    const consent = String(answers["FINALSURVEY-Q9"] || "");
    if (/^[ABC]:/.test(consent) && !String(answers["FINALSURVEY-Q10"] || "").trim()) {
      return fail("Vui lòng ghi Họ và tên theo hình thức hiển thị đã chọn.", 400, "CONSENT_NAME_REQUIRED");
    }
    if (/^F:/.test(consent) && !String(answers["FINALSURVEY-Q11"] || "").trim()) {
      return fail("Vui lòng ghi rõ hình thức sử dụng chia sẻ mà bạn đồng ý.", 400, "CONSENT_DETAIL_REQUIRED");
    }

    // Mã ẩn danh tăng dần: "Anonymous N"
    const { count } = await db
      .from("evaluation_responses")
      .select("id", { count: "exact", head: true })
      .eq("template_id", TEMPLATE_ID);
    const anonymousId = `Anonymous ${(count || 0) + 1}`;

    const scaleValues = [1, 2, 3, 4, 5]
      .map((n) => Number(answers[`FINALSURVEY-Q${n}`]))
      .filter((n) => Number.isFinite(n));
    const now = new Date().toISOString();

    const { data: response, error } = await db
      .from("evaluation_responses")
      .insert({
        template_id: TEMPLATE_ID,
        user_id: null,
        respondent_token: anonymousId,
        metadata: { kind: "final_survey", respondentType: "public_anonymous", cohortId },
        submitted_at: now,
      })
      .select("id")
      .single();
    if (error) throw error;

    const answerRows = Object.keys(answers)
      .filter((qid) => String(answers[qid] ?? "").trim() !== "")
      .map((qid) => {
        const n = Number(answers[qid]);
        return {
          response_id: response.id,
          question_id: qid,
          answer_text: String(answers[qid] ?? ""),
          answer_value: Number.isFinite(n) && String(answers[qid]).trim() !== "" ? n : null,
        };
      });
    if (answerRows.length) {
      const { error: ansError } = await db.from("evaluation_answers").insert(answerRows);
      if (ansError) throw ansError;
    }

    void scaleValues;
    return ok({ responseId: response.id, anonymousId });
  });
}
