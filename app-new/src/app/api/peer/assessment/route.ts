// ============================================================================
// /api/peer/assessment — Đánh giá 360° từ đồng nghiệp (public, không cần login)
// ----------------------------------------------------------------------------
// GET  ?targetUserId=...  -> thông tin rút gọn của học viên + bộ câu hỏi PEER-COMMON
// POST { targetUserId, respondentEmail, templateId?, answers } -> lưu đánh giá,
//      chặn trùng (1 email chỉ đánh giá 1 học viên 1 lần / template).
// Có rate-limit theo IP để chống spam. KHÔNG trả email/sđt của học viên.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, getClientIp, handle, ok, rateLimit } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { isValidEmail, normalizeEmail, normalizeScenarioAnswer, optString, reqString } from "@/lib/validators";

const PEER_TEMPLATE_ID = "PEER-COMMON";

function peerRateLimited(request: NextRequest): boolean {
  return rateLimit(`peer:${getClientIp(request)}`, 30, 60_000);
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    if (peerRateLimited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const targetCode = reqString(request.nextUrl.searchParams.get("targetUserId"), "mã học viên", 20).toUpperCase();

    const db = getServiceSupabase();
    const { data: target } = await db
      .from("profiles")
      .select("id, student_code, full_name, status")
      .eq("student_code", targetCode)
      .eq("status", "active")
      .maybeSingle();
    if (!target) return fail("Không tìm thấy học viên cần đánh giá.", 404, "TARGET_NOT_FOUND");

    const { data: questions } = await db
      .from("evaluation_questions")
      .select("question_id, question_text, question_type, options, sort_order, is_required, dimension")
      .eq("template_id", PEER_TEMPLATE_ID)
      .order("sort_order");

    return ok({
      targetUser: { studentCode: target.student_code, fullName: target.full_name },
      questions: (questions || []).map((q) => ({
        id: q.question_id,
        templateId: PEER_TEMPLATE_ID,
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
    if (peerRateLimited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    const body = await request.json().catch(() => ({}));
    const targetCode = reqString(body.targetUserId, "mã học viên", 20).toUpperCase();
    const respondentEmail = normalizeEmail(reqString(body.respondentEmail, "email", 120));
    if (!isValidEmail(respondentEmail)) return fail("Vui lòng nhập đúng email của bạn.", 400, "INVALID_EMAIL");
    const templateId = optString(body.templateId, 40) || "PEER-APP";
    const answers = (body.answers || {}) as Record<string, unknown>;

    const db = getServiceSupabase();
    const { data: target } = await db
      .from("profiles")
      .select("id, student_code, status")
      .eq("student_code", targetCode)
      .eq("status", "active")
      .maybeSingle();
    if (!target) return fail("Không tìm thấy học viên cần đánh giá.", 404, "TARGET_NOT_FOUND");

    // Chặn đánh giá trùng
    const { data: dup } = await db
      .from("evaluation_responses")
      .select("id")
      .eq("user_id", target.id)
      .eq("template_id", templateId)
      .eq("respondent_token", respondentEmail)
      .limit(1);
    if (dup?.length) {
      return fail("Email này đã gửi đánh giá cho học viên này rồi.", 409, "DUPLICATE_PEER_ASSESSMENT");
    }

    const now = new Date().toISOString();
    const { data: response, error } = await db
      .from("evaluation_responses")
      .insert({
        template_id: templateId,
        user_id: target.id,
        respondent_token: respondentEmail,
        metadata: { kind: "peer", respondentType: "peer" },
        submitted_at: now,
      })
      .select("id")
      .single();
    if (error) throw error;

    const answerRows = Object.keys(answers)
      .filter((qid) => String(answers[qid] ?? "").trim() !== "")
      .map((qid) => ({
        response_id: response.id,
        question_id: qid,
        answer_text: normalizeScenarioAnswer(answers[qid]),
      }));
    if (answerRows.length) {
      const { error: ansError } = await db.from("evaluation_answers").insert(answerRows);
      if (ansError) throw ansError;
    }

    return ok({ responseId: response.id });
  });
}
