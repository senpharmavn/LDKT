// ============================================================================
// POST /api/auth/register — Đăng ký học viên mới (thay registerParticipant)
// ----------------------------------------------------------------------------
// Body: { fullName, email, phone?, cohortId?, ... }.
// Luồng: inviteUserByEmail -> trigger handle_new_user tự tạo profile
// (kèm student_code LDKT###) -> cập nhật thêm họ tên/sđt/cohort.
// Nếu email đã có tài khoản: chỉ gửi lại invite, không tạo trùng.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { isValidEmail, normalizeEmail, optString, reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await request.json().catch(() => ({}));
    const fullName = reqString(body.fullName, "họ tên", 120);
    const email = reqString(body.email, "email", 120);
    if (!isValidEmail(email)) return fail("Email chưa đúng định dạng.", 400, "INVALID_EMAIL");
    const emailNorm = normalizeEmail(email);
    const phone = optString(body.phone, 20);
    const cohortId = optString(body.cohortId, 20) || null;

    const service = getServiceSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // Đã có profile với email/sđt này chưa?
    const { data: existing } = await service
      .from("profiles")
      .select("id, student_code, full_name, email")
      .eq("email", emailNorm)
      .limit(1);
    if (existing?.[0]) {
      // Gửi lại invite cho chắc, không tạo trùng
      await service.auth.admin.inviteUserByEmail(emailNorm, {
        redirectTo: appUrl ? `${appUrl}/` : undefined,
      });
      return ok({ mode: "existing", email: emailNorm, studentCode: existing[0].student_code });
    }

    // Tạo auth user qua invite -> trigger tự sinh profile + student_code
    const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(emailNorm, {
      data: { full_name: fullName },
      redirectTo: appUrl ? `${appUrl}/` : undefined,
    });
    if (inviteError || !invited.user) {
      console.error("[auth/register] invite failed:", inviteError?.message);
      return fail("Chưa đăng ký được. Vui lòng thử lại.", 500, "REGISTER_FAILED");
    }

    // Bổ sung thông tin profile (kể cả các trường mở rộng vào metadata)
    const extraMeta: Record<string, string> = {};
    for (const k of ["birthYear", "gender", "city", "companyName", "industryGroup", "totalWorkingYears", "isPeopleManager", "teamSize", "leadershipYears", "acquisitionSource", "registrationMotivation", "leadershipChallenge"]) {
      const v = optString(body[k], 500);
      if (v) extraMeta[k] = v;
    }
    const { error: updateError } = await service
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null, cohort_id: cohortId, metadata: extraMeta })
      .eq("id", invited.user.id);
    if (updateError) console.error("[auth/register] profile update failed:", updateError.message);

    const { data: profile } = await service
      .from("profiles")
      .select("student_code")
      .eq("id", invited.user.id)
      .single();

    return ok({ mode: "invited", email: emailNorm, studentCode: profile?.student_code ?? "" });
  });
}
