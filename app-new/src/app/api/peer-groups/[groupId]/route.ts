// ============================================================================
// PATCH /api/peer-groups/[groupId] — Đổi tên nhóm (thay renamePeerGroup)
// ----------------------------------------------------------------------------
// Body: { groupName } (tối đa 30 ký tự, giữ nguyên giới hạn cũ).
// Chỉ thành viên của nhóm mới được đổi tên.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { reqString } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const groupName = reqString(body.groupName, "tên nhóm", 30);

    const db = getServiceSupabase();
    const { data: membership } = await db
      .from("peer_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return fail("Bạn không phải thành viên của nhóm này.", 403, "NOT_A_MEMBER");

    const { error } = await db.from("peer_groups").update({ name: groupName }).eq("id", groupId);
    if (error) throw error;

    return ok({ groupId, groupName });
  });
}
