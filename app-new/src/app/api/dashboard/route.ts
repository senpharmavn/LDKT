// ============================================================================
// GET /api/dashboard — Dữ liệu tổng hợp cho app học viên (thay getDashboard)
// ----------------------------------------------------------------------------
// Query: ?scope=home|full (full kèm chi tiết câu hỏi đánh giá).
// Trả về đúng shape DashboardData để api.ts phía client dùng ngay,
// không cần mapping lại.
// ============================================================================
import { NextRequest } from "next/server";
import { buildDashboard } from "@/lib/dashboard";
import { fail, handle, ok, requireUser } from "@/lib/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const scope = request.nextUrl.searchParams.get("scope") === "full" ? "full" : "home";
    try {
      const data = await buildDashboard(user.id, scope);
      return ok({ data, uid: user.id });
    } catch (e) {
      if (e instanceof Error && e.message === "PROFILE_NOT_FOUND") {
        return fail("Không tìm thấy hồ sơ học viên.", 404, "PROFILE_NOT_FOUND");
      }
      throw e;
    }
  });
}
