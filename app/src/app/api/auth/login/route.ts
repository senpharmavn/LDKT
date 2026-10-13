// ============================================================================
// POST /api/auth/login — Đăng nhập / kích hoạt tài khoản (thay action login)
// ----------------------------------------------------------------------------
// Body: { identifier: email | sđt, studentCode: "LDKT001" }
// Luồng mới (Supabase Auth, bỏ token plaintext):
//  1. Tìm profile khớp student_code + (email|sđt), trạng thái active.
//  2. Chưa có tài khoản auth -> gửi email mời kích hoạt (Supabase invite),
//     trả về { mode: "invited" } — user bấm link trong email để đặt mật khẩu.
//  3. Đã có tài khoản -> trả { mode: "exists" } — client hiện form mật khẩu
//     và gọi supabase.auth.signInWithPassword trực tiếp.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { normalizeEmail, reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await request.json().catch(() => ({}));
    const identifier = reqString(body.identifier ?? body.email ?? body.phone, "email/số điện thoại", 120);
    const studentCode = reqString(body.studentCode ?? body.userId, "mã học viên", 20).toUpperCase();

    const service = getServiceSupabase();
    const idNorm = normalizeEmail(identifier);

    // Tìm profile khớp mã học viên + email/sđt
    const { data: profiles } = await service
      .from("profiles")
      .select("id, student_code, full_name, email, phone, cohort_id, status")
      .eq("student_code", studentCode);

    const profile = (profiles || []).find(
      (p) =>
        p.status === "active" &&
        ((p.email && normalizeEmail(p.email) === idNorm) || (p.phone && p.phone.replace(/\s/g, "") === identifier.replace(/\s/g, ""))),
    );
    if (!profile || !profile.email) {
      return fail("Email/số điện thoại hoặc mã học viên chưa đúng.", 401, "INVALID_CREDENTIALS");
    }

    // Đã có tài khoản auth chưa? (listUsers phân trang, perPage lớn cho chắc)
    const { data: existingUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authUser = (existingUsers?.users || []).find(
      (u) => u.email && normalizeEmail(u.email) === normalizeEmail(profile.email as string),
    );

    if (authUser) {
      return ok({
        mode: "exists",
        email: profile.email,
        studentCode: profile.student_code,
        fullName: profile.full_name,
      });
    }

    // Chưa có -> gửi email mời kích hoạt (đặt mật khẩu lần đầu)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const { error: inviteError } = await service.auth.admin.inviteUserByEmail(profile.email, {
      data: { student_code: profile.student_code, full_name: profile.full_name },
      redirectTo: appUrl ? `${appUrl}/` : undefined,
    });
    if (inviteError) {
      console.error("[auth/login] invite failed:", inviteError.message);
      return fail("Chưa gửi được email kích hoạt. Vui lòng thử lại.", 500, "INVITE_FAILED");
    }

    return ok({
      mode: "invited",
      email: profile.email,
      studentCode: profile.student_code,
      fullName: profile.full_name,
    });
  });
}
