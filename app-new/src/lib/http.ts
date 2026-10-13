// ============================================================================
// http.ts — Helper dùng chung cho mọi Route Handler
// ----------------------------------------------------------------------------
// - ok()/fail(): envelope JSON thống nhất { ok: true|false, ... }.
// - requireUser(): lấy user từ session, 401 nếu chưa đăng nhập.
// - requireAdmin(): 401/403 nếu không phải admin (đọc profiles.is_admin).
// - checkCronSecret(): xác thực cron nội bộ qua CRON_SECRET (timing-safe).
// - rateLimit(): giới hạn request cho form public (chống spam).
// ============================================================================
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "./supabaseServer";

export type ApiUser = {
  id: string; // auth.users.id (uuid)
  email?: string;
  profile: {
    id: string;
    student_code: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    cohort_id: string | null;
    is_admin: boolean;
    status: string;
  };
};

export function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error, ...(code ? { code } : {}) }, { status });
}

/** Lấy user + profile từ session. Trả null nếu chưa đăng nhập. */
export async function getApiUser(): Promise<ApiUser | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = getServiceSupabase();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.status !== "active") return null;

  return { id: user.id, email: user.email, profile };
}

/** Yêu cầu đăng nhập. Ném Response 401 để handler return trực tiếp. */
export async function requireUser(): Promise<ApiUser> {
  const apiUser = await getApiUser();
  if (!apiUser) throw fail("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.", 401, "UNAUTHENTICATED");
  return apiUser;
}

/** Yêu cầu quyền admin. Ném Response 401/403. */
export async function requireAdmin(): Promise<ApiUser> {
  const apiUser = await requireUser();
  if (!apiUser.profile.is_admin) throw fail("Bạn không có quyền thực hiện thao tác này.", 403, "FORBIDDEN");
  return apiUser;
}

/**
 * Xác thực cron nội bộ: header `Authorization: Bearer <CRON_SECRET>`
 * (Vercel Cron tự gửi header này theo cấu hình).
 */
export function checkCronSecret(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

// --- Rate limit đơn giản cho form public (theo IP, bộ nhớ tiến trình) --------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Giới hạn `max` request mỗi `windowMs` cho một key (thường là IP).
 * Trả true nếu VƯỢT giới hạn (nên trả 429).
 */
export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > max) return true;
  return false;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Ngày hôm nay theo múi giờ VN, định dạng yyyy-MM-dd. */
export function todayVn(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Wrapper cho mọi Route Handler: gom lỗi throw (kể cả Response từ
 * requireUser/requireAdmin) thành JSON { ok:false } thống nhất,
 * không để lộ stack trace ra client.
 *
 * Dùng: export async function GET(req) { return handle(async () => { ... }); }
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[api]", e);
    return fail("Đã có lỗi xảy ra. Vui lòng thử lại.", 500, "INTERNAL_ERROR");
  }
}

/**
 * Đọc cột metadata (JSONB) an toàn — Supabase trả kiểu Json nên cần cast
 * trước khi truy cập thuộc tính (tránh lỗi TypeScript strict).
 */
export function readMeta(row: { metadata?: unknown }): Record<string, unknown> {
  const m = (row as { metadata?: unknown }).metadata;
  return m && typeof m === "object" ? (m as Record<string, unknown>) : {};
}
