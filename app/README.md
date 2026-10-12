# Lãnh Đạo Khai Tâm - Phase 1 Prototype

Next.js app chuyển từ prototype HTML `ldkt_prototype_v21_refined.html` sang React.

## Phase 1 Scope

- Mobile-first app shell theo prototype.
- Home, Journey, Workshop, Challenge, Check-in, Đánh giá, Learning, Profile.
- Mock data trong `src/data/mock.ts`.
- LocalStorage cho check-in và đánh giá.
- API giả lập trong `src/lib/api.ts` để sau này thay bằng Google Sheet / Apps Script.
- Nếu có `NEXT_PUBLIC_GAS_API_URL`, check-in và đánh giá sẽ gửi thêm lên Apps Script sau khi lưu local.
- Toast sau khi gửi sẽ báo rõ dữ liệu đã đồng bộ Google Sheet hay chỉ mới lưu tạm local.
- PWA manifest tối giản, chưa gắn logo/app icon riêng.
- Tài liệu Google Sheet schema và scaffold Apps Script cho bước nối dữ liệu.
- Chưa làm notification, Firebase, admin dashboard, email reminder.

## Chạy Local

```bash
npm run dev
```

Mở:

```txt
http://127.0.0.1:3000
```

## Scripts

```bash
npm run lint
npm run build
```

## Cấu Trúc Chính

```txt
src/app/page.tsx           App state, navigation và screen rendering
src/app/manifest.ts        PWA manifest tối giản
src/components/ldkt-ui.tsx UI components dùng chung
src/components/ldkt-screens.tsx Các màn hình Phase 1
src/data/mock.ts           Dữ liệu mẫu Phase 1
src/lib/api.ts             Mock API layer
src/lib/local-store.ts     LocalStorage helpers
src/lib/progress.ts        Progress helpers
src/lib/status.ts          Status label helpers
src/types/ldkt.ts          Shared TypeScript types
docs/google-sheet-schema.md Google Sheet schema đề xuất
docs/api-contract.md       API contract cho Apps Script Web App
docs/deployment-notes.md   Ghi chú deploy local/Vercel/Apps Script
docs/phase-1-test-checklist.md Checklist test Phase 1
docs/sheet-templates/*.csv CSV template để tạo Google Sheet
google-apps-script/Code.gs Apps Script scaffold cho Phase 1 API
```

## Hướng Nối Google Sheet Sau Này

Giữ UI hiện tại, thay implementation trong `src/lib/api.ts` bằng Apps Script API:

- `getDashboard`
- `getCheckin`
- `saveCheckin`
- `getEvaluation`
- `saveEvaluation`

Notification để sau Phase 1.

Apps Script scaffold nằm ở `google-apps-script/Code.gs`. Khi dùng thật:

1. Tạo Google Sheet theo `docs/google-sheet-schema.md`.
2. Có thể import headers từ `docs/sheet-templates/*.csv`.
3. Copy `Code.gs` vào Apps Script.
4. Thay `PASTE_SPREADSHEET_ID_HERE`.
5. Deploy Apps Script dạng Web App.
6. Điền URL vào `.env.local` theo `.env.example`.

Lưu ý: `saveCheckin` và `saveEvaluation` trong scaffold dùng upsert. Khi học viên gửi lại cùng ngày hoặc cùng workshop, Apps Script cập nhật dòng cũ thay vì tạo dòng trùng.
