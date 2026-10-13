// ============================================================================
// push.ts — Gửi Web Push (thay thế luồng GAS cũ)
// ----------------------------------------------------------------------------
// VAPID keys lấy từ biến môi trường. Hàm sendPushBatch gửi theo đợt nhỏ
// (mỗi đợt 20) để tránh timeout serverless — khắc phục lỗi cũ gửi ồ ạt
// Promise.all hàng trăm subscription một lúc.
// ============================================================================
import webpush from "web-push";

export type PushItem = {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  title: string;
  body: string;
  url: string;
  tag: string;
};

export type PushResult = {
  endpoint: string;
  status: "sent" | "expired" | "failed";
};

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Thiếu cấu hình VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@lanhdaokhaitam.vn", publicKey, privateKey);
  vapidConfigured = true;
}

/** Gửi 1 notification, phân loại lỗi: 404/410 = subscription hết hạn. */
export async function sendOnePush(item: PushItem): Promise<PushResult> {
  ensureVapid();
  try {
    await webpush.sendNotification(
      item.subscription as webpush.PushSubscription,
      JSON.stringify({ title: item.title, body: item.body, url: item.url, tag: item.tag }),
      { TTL: 4 * 60 * 60, urgency: "high" },
    );
    return { endpoint: item.subscription.endpoint, status: "sent" };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
    return {
      endpoint: item.subscription.endpoint,
      status: statusCode === 404 || statusCode === 410 ? "expired" : "failed",
    };
  }
}

/** Gửi theo đợt (batch) để tránh nghẽn/timeout. */
export async function sendPushBatch(items: PushItem[], batchSize = 20): Promise<PushResult[]> {
  const results: PushResult[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sendOnePush));
    results.push(...batchResults);
  }
  return results;
}
