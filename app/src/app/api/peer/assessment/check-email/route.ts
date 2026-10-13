// ============================================================================
// POST /api/peer/assessment/check-email — Kiểm tra email đã đánh giá chưa
// ----------------------------------------------------------------------------
// Body: { targetUserId, respondentEmail, templateId? }
// Trả về { duplicate: true|false }. Public, có rate-limit.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, getClientIp, handle, ok, rateLimit } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { isValidEmail, normalizeEmail, optString, reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    if (rateLimit(`peer:${getClientIp(request)}`, 30, 60_000)) {
      return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429, "RATE_LIMITED");
    }
    const body = await request.json().catch(() => ({}));
    const targetCode = reqString(body.targetUserId, "mã học viên", 20).toUpperCase();
    const respondentEmail = normalizeEmail(reqString(body.respondentEmail, "email", 120));
    if (!isValidEmail(respondentEmail)) return fail("Vui lòng nhập đúng email của bạn.", 400, "INVALID_EMAIL");
    const templateId = optString(body.templateId, 40) || "PEER-APP";

    const db = getServiceSupabase();
    const { data: target } = await db
      .from("profiles")
      .select("id")
      .eq("student_code", targetCode)
      .eq("status", "active")
      .maybeSingle();
    if (!target) return fail("Không tìm thấy học viên cần đánh giá.", 404, "TARGET_NOT_FOUND");

    const { data: dup } = await db
      .from("evaluation_responses")
      .select("id")
      .eq("user_id", target.id)
      .eq("template_id", templateId)
      .eq("respondent_token", respondentEmail)
      .limit(1);

    return ok({ duplicate: Boolean(dup?.length) });
  });
}
