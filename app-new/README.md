# LDKT re-platform — Backend mới (Next.js Route Handlers + Supabase)

Thư mục này chứa backend thay thế Google Apps Script, viết để review
(trước khi merge vào repo `senpharmavn/LDKT`).

## Cấu trúc

- `src/lib/` — Supabase clients, helpers HTTP/auth/rate-limit, XP engine,
  quiz grading, web-push, validators, `api.ts` (viết lại giữ nguyên interface),
  `dashboard.ts` (ráp DashboardData).
- `src/app/api/` — Route Handlers (xem `MAPPING.md` để đối chiếu action cũ).
- `src/types/ldkt.ts` — copy từ repo gốc (giữ nguyên type UI).
- `.env.example` — biến môi trường cần thiết.

## Tích hợp vào repo (khi được duyệt)

1. Thêm dependencies vào `app/package.json`:
   `@supabase/supabase-js`, `@supabase/ssr` (bản mới nhất tương thích Next 16).
2. Copy `src/` vào `app/src/` (ghi đè `src/lib/api.ts` cũ).
3. Tạo `.env.local` từ `.env.example` và điền giá trị thật.
4. Chạy migration `supabase/migrations/001_initial_schema.sql` rồi
   `002_coaching_requests_and_push_logs.sql` trên Supabase SQL Editor.
5. Cấu hình Vercel Cron: `GET /api/push/dispatch` (giữ lịch 11:00/12:00 UTC
   như cũ) + cron đêm `POST /api/admin/stats/rebuild` (header
   `Authorization: Bearer $CRON_SECRET`).
6. Vercel Environment Variables: điền theo `.env.example`.

## Lưu ý

- `getServiceSupabase()` (service role) chỉ dùng trong Route Handlers.
- Form public có rate-limit theo IP (bộ nhớ tiến trình — khi scale nhiều
  instance cần chuyển sang Redis/Upstash).
- `loginUser(identifier, studentCode)` giữ chữ ký cũ nhưng đổi luồng:
  lần đầu trả `{mode:"invited"}` (đã gửi email kích hoạt), đã có TK trả
  `{mode:"exists"}` → UI hiện form mật khẩu gọi `loginWithPassword`.
  **Trang login (page.tsx) cần cập nhật UI cho luồng 2 bước này.**
- Chi tiết xem `MAPPING.md` và báo cáo review.
