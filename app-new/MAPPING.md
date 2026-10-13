# Mapping: GAS action → REST endpoint mới

Bảng đối chiếu toàn bộ 33 actions trong `Code.gs` sang Route Handlers Next.js.
File code nằm ở `src/app/api/...` (thư mục `app-new/`).

## Auth (Supabase Auth — bỏ token plaintext)

| GAS action | Endpoint mới | Ghi chú |
|---|---|---|
| `login` | `POST /api/auth/login` | Body `{identifier, studentCode}`. Lần đầu → gửi email mời kích hoạt (`mode: "invited"`); đã có TK → `mode: "exists"`, client đăng nhập bằng mật khẩu qua Supabase Auth |
| `registerParticipant` | `POST /api/auth/register` | Tạo auth user qua invite → trigger tự sinh profile + `student_code`; chống trùng email/sđt |
| — | `GET /api/auth/session` | Thông tin user đang đăng nhập (mới thêm cho UI) |
| — | `POST /api/auth/session` | Đăng xuất (mới thêm) |

## App học viên

| GAS action | Endpoint mới | Ghi chú |
|---|---|---|
| `getDashboard` | `GET /api/dashboard?scope=home\|full` | Trả đúng shape `DashboardData`; XP/streak tính ở server (nguồn duy nhất) |
| `saveCheckin` | `POST /api/checkins` | Upsert theo `(user_id, challenge_id)`; check-in mới → +20 XP |
| `saveEvaluation` | `POST /api/evaluations/simple` | Đánh giá nhanh workshop → lưu vào template `WS-SIMPLE` |
| `saveEvaluationResponse` | `POST /api/evaluations/responses` | Validate câu bắt buộc; fail-close (template locked → 403); self-eval mới → +20 XP |
| `startFinalQuiz` | `POST /api/quiz/start` | Kiểm tra `is_open` + `max_attempts`; trả câu hỏi KHÔNG kèm answer_key |
| `submitFinalQuiz` | `POST /api/quiz/submit` | Bắt buộc đủ câu; chấm 10 câu × 7đ (giữ nguyên) |
| `gradeFinalQuiz` | `POST /api/quiz/grade` | **Admin only**; tự luận 0–30; `publish` để công bố |
| `joinPeerGroup` | `POST /api/peer-groups/join` | 1 user 1 nhóm; kiểm tra sức chứa (UNIQUE chống đua) |
| `renamePeerGroup` | `PATCH /api/peer-groups/[groupId]` | Chỉ thành viên; tên ≤ 30 ký tự |
| `saveGroupCheckin` | `POST /api/peer-groups/[groupId]/checkins` | 1 check-in/tuần (UNIQUE); server tự tính tuần hiện tại; +30 XP |
| `registerCoaching` | `POST /api/coaching/requests` | Chỉ khi WS7 `now`; 1 request đang hoạt động/user |
| `bookCoachingSlot` | `POST /api/coaching/bookings` | Phải được admin `selected`; UNIQUE(slot_id) chống đặt trùng |
| `savePushSubscription` | `POST /api/push/subscriptions` | Upsert theo endpoint |
| `removePushSubscription` | `DELETE /api/push/subscriptions` | Xoá dòng của chính user |

## Push cron (gộp — không cần GAS)

| GAS action | Endpoint mới | Ghi chú |
|---|---|---|
| `getPushDispatch` + `markPushDeliveries` | `GET /api/push/dispatch` | Một route duy nhất: Bearer CRON_SECRET → tính items → gửi batch 20 → log `notification_logs` → đánh dấu expired. `?type=`/`?date=` tùy chọn; mặc định theo giờ VN (18h workshop, 19h challenge) |

## Form public (không login, rate-limit IP)

| GAS action | Endpoint mới | Ghi chú |
|---|---|---|
| `getPeerAssessment` | `GET /api/peer/assessment?targetUserId=` | Không trả email/sđt học viên (bản cũ lộ email) |
| `checkPeerAssessmentEmail` | `POST /api/peer/assessment/check-email` | Trả `{duplicate}` |
| `savePeerAssessment` | `POST /api/peer/assessment` | Chống trùng theo (target, template, email) |
| `getPublicWorkshopEvaluation` | `GET /api/public/workshop-evaluation` | Chỉ template `workshop` + `active` |
| `savePublicWorkshopEvaluation` | `POST /api/public/workshop-evaluation` | Lưu ẩn danh (`user_id` NULL) |
| `getPublicFinalSurvey` | `GET /api/public/final-survey` | Template FINALSURVEY active |
| `savePublicFinalSurvey` | `POST /api/public/final-survey` | Ẩn danh `Anonymous N`; giữ logic Q9/Q10/Q11 |

## Admin (mới — thay việc sửa Sheet tay)

| GAS action | Endpoint mới | Ghi chú |
|---|---|---|
| `getInstructorDashboard` | `GET /api/admin/dashboard` | Tổng quan + leaderboard + quiz/coaching chờ xử lý (mức cơ bản) |
| `selectCoachingCandidates` | `POST /api/admin/coaching/select` | `{requestIds[], selected?}` |
| `rebuildStudentStats` / `syncMissingStudentStats` | `POST /api/admin/stats/rebuild` | Tính lại `stats_daily`; cron đêm gọi bằng CRON_SECRET |
| `publishAssessmentReport` | *chưa port* | Cần quyết định: logic gửi email + link report sẽ làm ở phase dashboard GV |
| `rebuildInstructorSummaries` | *chưa port* | Thuộc phase dashboard giảng viên |
| — | `GET/POST /api/admin/workshops`, `PATCH/DELETE /api/admin/workshops/[id]` | CRUD workshop; quy tắc 1 workshop `now` duy nhất |
| — | `GET/POST /api/admin/challenges`, `PATCH/DELETE /api/admin/challenges/[id]` | CRUD mini challenge (`active/draft/archived`) |
| — | `GET/POST /api/admin/templates`, `PATCH/DELETE /api/admin/templates/[id]` | CRUD form/quiz; bật/tắt (`active/locked` + `is_open`) |

## Bỏ hẳn (đặc thù GAS/Sheet, không còn ý nghĩa)

| GAS action | Lý do bỏ |
|---|---|
| `syncUserSystemFields`, `syncNewUsers`, `setupUserAutomationTriggers`, `syncUserSystemFieldsUnlocked` | Đồng bộ cột Sheet — không còn Sheet |
| `setupStudentStatsUserTrigger`, `deleteStudentStatsUserTriggers`, `handleUsersSheetEditForStudentStats`, `handleUsersSheetChangeForStudentStats` | Trigger Sheet → thay bằng cron `/api/admin/stats/rebuild` |
| `setupInstructorSummaryTrigger`, `deleteInstructorSummaryTriggers` | Trigger GAS — thay bằng Vercel Cron |
| `setupPushReminderTriggers`, `deletePushReminderTriggers`, `setupPushTestTrigger`, `sendPushTestNotification`, `sendWorkshopPushReminders`, `sendChallengePushReminders`, `callPushDispatchEndpoint` | Trigger GAS — thay bằng Vercel Cron gọi trực tiếp `/api/push/dispatch` |
| `sendDailyReminders`, `buildReminderTasks`, `buildReminderText/Html`, `appendEmailLog`, `hasReminderLog`, `setupReminderAt22/11/20`, `setupDailyReminderTrigger`, `deleteDailyReminderTriggers` | Email nhắc hằng ngày qua MailApp — **cần user quyết có giữ không** (Resend/SES thay thế ở phase sau) |
| `updateLeadershipReportLink`, `buildLeadershipReportLink`, `sendLeadershipReportEmailIfNeeded`, `hasLeadershipReportEmailLog`, `appendLeadershipReportEmailLog`, `buildLeadershipReportEmailText/Html` | Gửi email report — cùng quyết định email ở trên |
| `updateStudentStatsForUser`, `updateStudentStatsRanks`, `setUserXp` | Ghi trực tiếp cột Sheet — thay bằng `xp_events` + cron rebuild |
| `ensureSheetHeader`, `ensureSheetWithHeaders`, `getSpreadsheet`, `readSheet`, `appendObject`, `upsertObject`, ... | Hạ tầng đọc/ghi Sheet — xóa toàn bộ |
