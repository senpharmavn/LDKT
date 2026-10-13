// ============================================================================
// GET /api/push/dispatch — Cron gửi push nhắc nhở (thay getPushDispatch +
// markPushDeliveries + route dispatch cũ, GỘP thành một — không cần GAS nữa)
// ----------------------------------------------------------------------------
// Xác thực: header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron).
// Query: ?type=challenge|workshop|test & ?date=yyyy-MM-dd (mặc định hôm nay VN;
//        type mặc định theo giờ: 18h -> workshop, 19h -> challenge).
// Luồng: tính items cần gửi -> gửi theo batch -> log vào notification_logs
// (chống gửi trùng) -> subscription hết hạn (404/410) -> đánh dấu expired.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { checkCronSecret, handle, todayVn } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { PushItem, sendPushBatch } from "@/lib/push";

export const runtime = "nodejs";

type DispatchType = "challenge" | "workshop" | "test";

function resolveType(request: NextRequest): DispatchType | "" {
  const q = request.nextUrl.searchParams.get("type");
  if (q === "challenge" || q === "workshop" || q === "test") return q;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hourCycle: "h23" }).format(new Date()),
  );
  if (hour === 18) return "workshop";
  if (hour === 19) return "challenge";
  return "";
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    if (!checkCronSecret(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const type = resolveType(request);
    const dateParam = request.nextUrl.searchParams.get("date");
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam || "") ? (dateParam as string) : todayVn();
    if (!type) return NextResponse.json({ ok: true, skipped: true, date });

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return NextResponse.json({ ok: false, error: "Push environment is incomplete" }, { status: 503 });
    }

    const db = getServiceSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // Hoạt động diễn ra hôm nay
    let activities: { id: string; title: string }[] = [];
    if (type === "challenge") {
      const { data } = await db.from("mini_challenges").select("id, title").eq("challenge_date", date).neq("status", "archived");
      activities = (data || []).map((a) => ({ id: a.id, title: a.title }));
    } else if (type === "workshop") {
      const { data } = await db.from("workshops").select("id, title").eq("session_date", date);
      activities = (data || []).map((a) => ({ id: a.id, title: a.title }));
    } else {
      activities = [{ id: `PUSH-TEST-${date}`, title: "Kiểm tra thông báo" }];
    }
    if (!activities.length) return NextResponse.json({ ok: true, attempted: 0, date, type });

    // Subscriptions đang hoạt động của học viên active
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth_key, profiles!inner(status)")
      .eq("status", "active");
    const activeSubs = (subs || []).filter((s) => (s as unknown as { profiles: { status: string } }).profiles?.status === "active");

    // Check-in hôm nay (để không nhắc challenge đã làm)
    const { data: todayCheckins } = await db.from("checkins").select("user_id, challenge_id").eq("checkin_date", date);
    const doneSet = new Set((todayCheckins || []).map((c) => `${c.user_id}|${c.challenge_id}`));

    // Log đã gửi (chống trùng)
    const { data: logs } = await db.from("notification_logs").select("log_key").eq("log_date", date).eq("status", "sent");
    const sentKeys = new Set((logs || []).map((l) => l.log_key));

    const items: (PushItem & { logKey: string; userId: string; subscriptionId: string; activityId: string })[] = [];
    for (const sub of activeSubs) {
      for (const act of activities) {
        if (type === "challenge" && doneSet.has(`${sub.user_id}|${act.id}`)) continue;
        const logKey = [date, type, sub.user_id, act.id, sub.id].join("|");
        if (sentKeys.has(logKey)) continue;
        items.push({
          logKey,
          userId: sub.user_id,
          subscriptionId: sub.id,
          activityId: act.id,
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh || "", auth: sub.auth_key || "" } },
          title: type === "challenge" ? "Mini Challenge hôm nay" : type === "workshop" ? "Workshop hôm nay" : "Kiểm tra thông báo Lãnh Đạo Khai Tâm",
          body:
            type === "challenge"
              ? `Dành vài phút thực hiện ${act.title || "mini challenge"} và check-in nhé.`
              : type === "workshop"
                ? `Hẹn bạn tại ${act.title || "workshop"} hôm nay.`
                : "Thông báo thử đã hoạt động.",
          url: appUrl + (type === "challenge" ? "?open=challenge" : type === "workshop" ? "?open=workshop" : ""),
          tag: `ldkt-${type}-${act.id}-${date}`,
        });
      }
    }

    const results = await sendPushBatch(items, 20);

    // Log kết quả + dọn subscription hết hạn
    const resultByEndpoint = new Map(results.map((r) => [r.endpoint, r.status]));
    const logRows = items.map((item) => ({
      log_key: item.logKey,
      user_id: item.userId,
      subscription_id: item.subscriptionId,
      type,
      activity_id: item.activityId,
      log_date: date,
      status: resultByEndpoint.get(item.subscription.endpoint) || "failed",
    }));
    if (logRows.length) await db.from("notification_logs").upsert(logRows, { onConflict: "log_key" });

    const expiredEndpoints = results.filter((r) => r.status === "expired").map((r) => r.endpoint);
    if (expiredEndpoints.length) {
      await db.from("push_subscriptions").update({ status: "expired" }).in("endpoint", expiredEndpoints);
    }

    return NextResponse.json({
      ok: true,
      type,
      date,
      attempted: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      expired: expiredEndpoints.length,
    });
  });
}
