import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

type DispatchItem = {
  logKey: string;
  userId: string;
  subscriptionId: string;
  type: string;
  date: string;
  activityId: string;
  subscription: webpush.PushSubscription;
  title: string;
  body: string;
  url: string;
  tag: string;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const gasUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!gasUrl || !publicKey || !privateKey) {
    return NextResponse.json({ ok: false, error: "Push environment is incomplete" }, { status: 503 });
  }

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const hour = Number(part("hour"));
  const requestedType = request.nextUrl.searchParams.get("type");
  const requestedDate = request.nextUrl.searchParams.get("date");
  const reminderType = requestedType === "workshop" || requestedType === "challenge" || requestedType === "test"
    ? requestedType
    : hour === 18
      ? "workshop"
      : hour === 19
        ? "challenge"
        : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || "") ? requestedDate || today : today;
  if (!reminderType) return NextResponse.json({ ok: true, skipped: true, date, hour });

  const dispatchUrl = new URL(gasUrl);
  dispatchUrl.searchParams.set("action", "getPushDispatch");
  dispatchUrl.searchParams.set("secret", cronSecret);
  dispatchUrl.searchParams.set("date", date);
  dispatchUrl.searchParams.set("type", reminderType);
  const dispatchResponse = await fetch(dispatchUrl, { cache: "no-store" });
  const dispatch = await dispatchResponse.json() as { ok?: boolean; items?: DispatchItem[]; error?: string };
  if (!dispatch.ok) return NextResponse.json(dispatch, { status: 502 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@lanhdaokhaitam.vn", publicKey, privateKey);
  const results = await Promise.all((dispatch.items || []).map(async (item) => {
    try {
      await webpush.sendNotification(item.subscription, JSON.stringify(item), {
        TTL: 4 * 60 * 60,
        urgency: "high",
      });
      return { logKey: item.logKey, userId: item.userId, subscriptionId: item.subscriptionId, type: item.type, date: item.date, activityId: item.activityId, status: "sent" };
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      return { logKey: item.logKey, userId: item.userId, subscriptionId: item.subscriptionId, type: item.type, date: item.date, activityId: item.activityId, status: statusCode === 404 || statusCode === 410 ? "expired" : "failed" };
    }
  }));

  await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "markPushDeliveries", secret: cronSecret, results }),
  });

  return NextResponse.json({ ok: true, type: reminderType, date, attempted: results.length, results });
}
