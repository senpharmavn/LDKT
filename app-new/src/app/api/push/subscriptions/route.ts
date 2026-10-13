// ============================================================================
// /api/push/subscriptions — Quản lý đăng ký nhận push (thay savePushSubscription
// và removePushSubscription)
// ----------------------------------------------------------------------------
// POST   { subscription: { endpoint, keys: { p256dh, auth } }, userAgent? }
//        -> upsert theo endpoint (mỗi thiết bị 1 dòng).
// DELETE { endpoint } -> gỡ đăng ký của chính user.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqString } from "@/lib/validators";

type PushSubscriptionPayload = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const subscription = (body.subscription || {}) as PushSubscriptionPayload;
    const endpoint = reqString(subscription.endpoint, "push endpoint", 500);
    const p256dh = reqString(subscription.keys?.p256dh, "push key", 300);
    const authKey = reqString(subscription.keys?.auth, "push auth", 100);
    const userAgent = optString(body.userAgent, 500);

    const db = getServiceSupabase();
    const { error } = await db.from("push_subscriptions").upsert(
      { user_id: user.id, endpoint, p256dh, auth_key: authKey, status: "active" },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    void userAgent; // giữ trường để tương thích, chưa lưu (schema không có cột)

    return ok({ subscribed: true });
  });
}

export async function DELETE(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const endpoint = reqString(body.endpoint, "push endpoint", 500);

    const db = getServiceSupabase();
    // Xoá hẳn dòng của chính user (đơn giản, dứt khoát hơn cờ inactive)
    const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
    if (error) throw error;

    return ok({ unsubscribed: true });
  });
}
