// ============================================================================
// /api/admin/challenges — Quản lý mini challenge (thay sửa sheet tay)
// ----------------------------------------------------------------------------
// ADMIN ONLY.
// GET  ?workshopId= -> danh sách challenge.
// POST { id?, workshopId, day, title, description?, instruction?, status?, challengeDate?, cohortId? }
//      -> status: active|draft|archived (bản cũ: Draft vẫn lọt ra app —
//         bản mới API client chỉ trả active cho user).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqInt, reqString } from "@/lib/validators";

const VALID_STATUS = ["active", "draft", "archived"];

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin();
    const workshopId = request.nextUrl.searchParams.get("workshopId");
    const db = getServiceSupabase();
    let q = db.from("mini_challenges").select("*").order("workshop_id").order("day");
    if (workshopId) q = q.eq("workshop_id", workshopId);
    const { data } = await q.limit(200);
    return ok({ challenges: data || [] });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const workshopId = reqString(body.workshopId, "mã workshop", 20);
    const day = reqInt(body.day, "ngày", 1, 365);
    const title = reqString(body.title, "tiêu đề", 200);
    const status = optString(body.status, 20) || "draft";
    if (!VALID_STATUS.includes(status)) return fail(`Trạng thái không hợp lệ: ${status}.`, 400, "INVALID_STATUS");

    const db = getServiceSupabase();
    const { data: ws } = await db.from("workshops").select("id").eq("id", workshopId).maybeSingle();
    if (!ws) return fail("Không tìm thấy workshop.", 404, "WORKSHOP_NOT_FOUND");

    const id = optString(body.id, 20).toUpperCase() || `${workshopId}-D${day}`;
    const { data, error } = await db
      .from("mini_challenges")
      .insert({
        id,
        workshop_id: workshopId,
        day,
        title,
        description: optString(body.description, 2000) || null,
        instruction: optString(body.instruction, 2000) || null,
        status,
        challenge_date: optString(body.challengeDate, 10) || null,
        cohort_id: optString(body.cohortId, 20) || null,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return fail(`Challenge ${id} đã tồn tại.`, 409, "DUPLICATE_ID");
      throw error;
    }
    return ok({ challenge: data }, 201);
  });
}
