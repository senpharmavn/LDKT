# Deployment Notes

## Required Environment Variable

Create this variable in local `.env.local` and in Vercel project settings:

```txt
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/.../exec
```

Current local test Web App URL:

```txt
https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec
```

## Web Push

Thêm các biến sau trong Vercel:

```txt
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@lanhdaokhaitam.vn
CRON_SECRET=...
```

Tạo VAPID key một lần bằng `npx web-push generate-vapid-keys`. Đặt cùng giá trị `CRON_SECRET` vào Apps Script > Project Settings > Script Properties. Cron trong `vercel.json` chạy 18:00 và 19:00 theo giờ Việt Nam (11:00 và 12:00 UTC). Apps Script cũng tạo hai time trigger dự phòng bằng action `setupPushReminderTriggers` để tránh bỏ lỡ lịch khi cron hosting không chạy.

## Local Test URL

```txt
http://127.0.0.1:3000?token=demo-token
```

## Vercel

1. Import the `app` folder as the Next.js project root.
2. Add `NEXT_PUBLIC_GAS_API_URL`.
3. Deploy.
4. Open the deployed URL with a learner token:

```txt
https://your-vercel-domain.vercel.app?token=demo-token
```

## Apps Script

When `google-apps-script/Code.gs` changes:

1. Copy the file content into Apps Script.
2. Keep the real `SPREADSHEET_ID`.
3. Save.
4. Deploy > Manage deployments > Edit.
5. Select New version.
6. Deploy.

## Current Google Sheet ID

```txt
1UiqBretXwydIxFzixHXGmIaVvjCC9K93V8DKbdDJbuY
```
