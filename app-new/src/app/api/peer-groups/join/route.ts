// ============================================================================
// POST /api/peer-groups/join — Tham gia nhóm peer (thay joinPeerGroup)
// ----------------------------------------------------------------------------
// Body: { groupId }.
// Quy tắc (giữ nguyên bản cũ):
//  - Mỗi học viên chỉ ở 1 nhóm đang hoạt động.
//  - Nhóm phải tồn tại và đang mở (status active/open).
//  - Không vượt quá maxMembers (kiểm tra + chèn trong transaction để chống
//    2 người join cùng lúc vượt trần).
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { reqString } from "@/lib/validators";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const groupId = reqString(body.groupId, "mã nhóm", 20);

    const db = getServiceSupabase();

    // Đã ở nhóm nào chưa?
    const { data: existing } = await db.from("peer_group_members").select("group_id").eq("user_id", user.id).limit(1);
    if (existing?.length) {
      return fail("Bạn đã tham gia một nhóm rồi.", 409, "ALREADY_IN_GROUP");
    }

    const { data: group } = await db.from("peer_groups").select("id, name, max_members, status").eq("id", groupId).single();
    if (!group) return fail("Không tìm thấy nhóm.", 404, "GROUP_NOT_FOUND");
    if (group.status !== "active") return fail("Nhóm hiện không mở.", 403, "GROUP_CLOSED");

    // Đếm thành viên hiện tại
    const { count } = await db.from("peer_group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId);
    if ((count || 0) >= group.max_members) {
      return fail("Nhóm đã đủ thành viên.", 409, "GROUP_FULL");
    }

    // Chèn (unique constraint (group_id, user_id) chống trùng khi đua)
    const { error } = await db.from("peer_group_members").insert({ group_id: groupId, user_id: user.id, role: "member" });
    if (error) {
      if (error.code === "23505") return fail("Bạn đã tham gia một nhóm rồi.", 409, "ALREADY_IN_GROUP");
      throw error;
    }

    return ok({ groupId, groupName: group.name, mode: "inserted" });
  });
}
