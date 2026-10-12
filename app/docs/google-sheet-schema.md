# Google Sheet Schema - Phase 1

Phase 1 dùng Google Sheet làm database, thông qua Google Apps Script Web App.

CSV templates nằm trong `docs/sheet-templates/`.

## Users

| Field | Notes |
| --- | --- |
| UserID | Mã học viên, ví dụ `LDKT018` |
| FullName | Họ tên |
| Email | Email học viên |
| Phone | Số điện thoại, nếu có |
| Department | Phòng ban hoặc team |
| Batch | Khóa học, ví dụ `K12` |
| Role | Vai trò, mặc định `Học viên` |
| StartDate | Ngày bắt đầu journey |
| CurrentWorkshop | Workshop hiện tại |
| Status | `Active`, `Paused`, `Completed` |
| Token | Token dùng cho invite/login link |

## Workshops

| Field | Notes |
| --- | --- |
| WorkshopID | Ví dụ `WS1` |
| Title | Tên workshop |
| Description | Mô tả ngắn |
| Order | Thứ tự hiển thị |
| Status | `done`, `now`, `locked` theo từng user hoặc batch |
| ScheduleDate | Ngày workshop; nguồn chuẩn để gửi nhắc lúc 19:00 |

## Mini_Challenges

| Field | Notes |
| --- | --- |
| ChallengeID | Ví dụ `MC3-D2` |
| WorkshopID | Workshop gắn với mini challenge |
| Day | Ngày trong mini challenge |
| Title | Tên thử thách |
| Description | Mô tả |
| Instruction | Hướng dẫn thực hành |
| Status | `Active`, `Draft`, `Archived` |
| Date | Ngày thực hiện; nguồn chuẩn để gửi nhắc lúc 20:00 |

## Checkins

| Field | Notes |
| --- | --- |
| CheckinID | ID duy nhất |
| UserID | Mã học viên |
| WorkshopID | Workshop hiện tại |
| ChallengeID | Challenge hiện tại |
| Day | Ngày mini challenge |
| Completed | `TRUE` hoặc `FALSE` |
| Mood | Cảm xúc |
| Insight | Điều nhận ra |
| NextAction | Hành động nhỏ ngày mai |
| CreatedAt | Thời điểm tạo |
| UpdatedAt | Thời điểm cập nhật |

## Evaluations

| Field | Notes |
| --- | --- |
| EvaluationID | ID duy nhất |
| UserID | Mã học viên |
| WorkshopID | Workshop được đánh giá |
| Rating | 1 đến 5 |
| Feedback | Điều học viên thích nhất |
| CreatedAt | Thời điểm tạo |
| UpdatedAt | Thời điểm cập nhật |

## API Actions

Apps Script Phase 1 chỉ cần:

- `getDashboard`
- `saveCheckin`
- `saveEvaluation`

## Push_Subscriptions

Được tạo tự động khi học viên bật thông báo. Khóa thiết bị là `Endpoint`; mỗi dòng lưu `SubscriptionID`, `UserID`, `P256dh`, `Auth`, `UserAgent`, `Status`, `CreatedAt`, `UpdatedAt`.

## Notification_Log

Được tạo tự động khi cron gửi thông báo. `LogKey` chống gửi trùng theo ngày + loại + người dùng + hoạt động + thiết bị. Các cột còn lại: `LogID`, `UserID`, `SubscriptionID`, `Type`, `ActivityID`, `Date`, `Status`, `SentAt`.
