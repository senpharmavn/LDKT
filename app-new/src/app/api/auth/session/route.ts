// ============================================================================
// GET /api/auth/me — Thông tin user đang đăng nhập
// POST /api/auth/logout — Đăng xuất (xóa session phía server)
// ============================================================================
import { NextRequest } from "next/server";
import { fail, getApiUser, handle, ok } from "@/lib/http";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function GET() {
  return handle(async () => {
    const apiUser = await getApiUser();
    if (!apiUser) return fail("Chưa đăng nhập.", 401, "UNAUTHENTICATED");
    const p = apiUser.profile;
    return ok({
      user: {
        id: p.student_code,
        authId: p.id,
        name: p.full_name,
        email: p.email,
        phone: p.phone,
        batch: p.cohort_id,
        cohortId: p.cohort_id,
        isAdmin: p.is_admin,
        participationStatus: p.status === "active" ? "Active" : p.status,
      },
    });
  });
}

export async function POST(_request: NextRequest) {
  return handle(async () => {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    return ok({ signedOut: true });
  });
}
