// ============================================================================
// /api/public/workshop-evaluation — Form đánh giá workshop công khai
// (thay getPublicWorkshopEvaluation / savePublicWorkshopEvaluation)
// ----------------------------------------------------------------------------
// GET  ?templateId=&workshopId=&sessionType=&cohortId= -> template + câu hỏi
//       (chỉ template type='workshop', status='active').
// POST { templateId, workshopId?, sessionType?, cohortId?, answers }
//       -> lưu ẩn danh (user_id NULL), validate câu bắt buộc.
// Public, rate-limit theo IP.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, getClientIp, handle, ok, rateLimit } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { getQuestionsForTemplate } from "@/lib/evaluationQuestions";
import { hasAnswerValue, optString, reqString } from "@/lib/validators";

function limited(request: NextRequest): boolean {
  return rateLimit(`public-we:${getClientIp(request)}`, 30, 60_000);
}

function normalizeKey(v: string): string {
  return v.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    if (limited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const q = request.nextUrl.searchParams;
    const templateId = normalizeKey(q.get("templateId") || "");
    const workshopId = normalizeKey(q.get("workshopId") || "");
    const sessionType = normalizeKey(q.get("sessionType") || "main");

    const db = getServiceSupabase();
    const { data: templates } = await db
      .from("evaluation_templates")
      .select("*")
      .eq("type", "workshop")
      .eq("status", "active");
    if (!templates?.length) return fail("Chưa có form đánh giá workshop đang mở.", 404, "NO_OPEN_FORM");

    let selected =
      (templateId && templates.find((t) => normalizeKey(t.id) === templateId)) ||
      null;
    if (!selected && workshopId) {
      const byWs = templates.filter((t) => normalizeKey(t.workshop_id || "") === workshopId);
      selected = byWs.find((t) => normalizeKey(t.session_type || "") === sessionType) || byWs[0] || null;
    }
    if (!selected) {
      selected = templates.find((t) => normalizeKey(t.session_type || "") === "main") || templates[0];
    }

    // Cau hoi: GOP ngan hang COMMON (giong ban cu getPublicWorkshopQuestions)
    const questions = await getQuestionsForTemplate(
      db,
      { id: selected.id, type: selected.type },
      "question_id, question_text, question_type, options, sort_order, is_required, dimension",
    );

    return ok({
      template: {
        id: selected.id,
        type: selected.type,
        workshopId: selected.workshop_id,
        sessionType: selected.session_type || "main",
        title: selected.title,
        description: selected.description,
        status: selected.status,
        formUrl: selected.form_url,
      },
      evaluationQuestions: (questions || []).map((row) => ({
        id: row.question_id,
        templateId: selected.id,
        order: row.sort_order,
        text: row.question_text,
        type: row.question_type,
        options: (row.options || "").split(/\s*\|\s*/).map((s: string) => s.trim()).filter(Boolean),
        required: row.is_required,
        dimension: row.dimension || "",
      })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    if (limited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const body = await request.json().catch(() => ({}));
    const templateId = reqString(body.templateId, "mã form", 40);
    const answers = (body.answers || {}) as Record<string, unknown>;
    const cohortId = optString(body.cohortId, 20);

    const db = getServiceSupabase();
    const { data: template } = await db
      .from("evaluation_templates")
      .select("id, type, status")
      .eq("id", templateId)
      .eq("type", "workshop")
      .eq("status", "active")
      .maybeSingle();
    if (!template) return fail("Form đánh giá không hợp lệ hoặc đã đóng.", 404, "INVALID_TEMPLATE");

    if (cohortId) {
      const { data: cohort } = await db.from("cohorts").select("id").eq("id", cohortId).maybeSingle();
      if (!cohort) return fail("Cohort trong link đánh giá không hợp lệ.", 400, "INVALID_COHORT");
    }

    // Validate cau bat buoc — GOP ngan hang COMMON nhu ban cu
    const questions = await getQuestionsForTemplate<{ question_id: string; is_required: boolean }>(
      db,
      { id: template.id, type: template.type },
      "question_id, is_required",
    );
    const missing = (questions || []).filter((qq) => qq.is_required && !hasAnswerValue(answers, qq.question_id));
    if (missing.length) {
      return fail("Vui lòng trả lời đầy đủ các câu bắt buộc.", 400, "MISSING_REQUIRED_ANSWERS");
    }

    const now = new Date().toISOString();
    const { data: response, error } = await db
      .from("evaluation_responses")
      .insert({
        template_id: templateId,
        user_id: null,
        metadata: {
          kind: "public_workshop",
          respondentType: "public",
          cohortId: cohortId || null,
          workshopId: optString(body.workshopId, 20),
          sessionType: optString(body.sessionType, 20) || "main",
        },
        submitted_at: now,
      })
      .select("id")
      .single();
    if (error) throw error;

    const answerRows = Object.keys(answers)
      .filter((qid) => hasAnswerValue(answers, qid))
      .map((qid) => ({
        response_id: response.id,
        question_id: qid,
        answer_text: Array.isArray(answers[qid]) ? null : String(answers[qid] ?? ""),
        answer_value: (() => {
          const n = Number(answers[qid]);
          return !Array.isArray(answers[qid]) && Number.isFinite(n) && String(answers[qid]).trim() !== "" ? n : null;
        })(),
        selected_options: Array.isArray(answers[qid]) ? (answers[qid] as unknown[]).map((v) => String(v)) : null,
      }));
    if (answerRows.length) {
      const { error: ansError } = await db.from("evaluation_answers").insert(answerRows);
      if (ansError) throw ansError;
    }

    return ok({ responseId: response.id });
  });
}
