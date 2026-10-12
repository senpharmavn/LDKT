# API Contract - Phase 1

Frontend gọi Google Apps Script Web App bằng `action`.

## Base URL

```txt
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/.../exec
```

## GET getDashboard

Request:

```txt
GET {BASE_URL}?action=getDashboard&token=demo-token
```

Response:

```json
{
  "ok": true,
  "user": {
    "UserID": "LDKT018",
    "FullName": "Trần Phú Gia",
    "Batch": "K12",
    "Role": "Học viên",
    "CurrentWorkshop": 3
  },
  "workshops": [],
  "challenges": [],
  "checkins": [],
  "evaluations": []
}
```

## POST saveCheckin

Header:

```txt
Content-Type: text/plain;charset=utf-8
```

Request:

```json
{
  "action": "saveCheckin",
  "token": "demo-token",
  "workshopId": "WS3",
  "challengeId": "MC3-D2",
  "day": 2,
  "completed": true,
  "mood": "Tĩnh",
  "insight": "Tôi nhận ra mình cần dừng lại trước khi phản hồi.",
  "nextAction": "Tôi sẽ đặt một câu hỏi trước khi đưa ý kiến."
}
```

Response:

```json
{
  "ok": true,
  "mode": "inserted",
  "checkin": {
    "CheckinID": "CHK-...",
    "UserID": "LDKT018",
    "WorkshopID": "WS3",
    "ChallengeID": "MC3-D2",
    "Day": 2,
    "Completed": "TRUE"
  }
}
```

## POST saveEvaluation

Header:

```txt
Content-Type: text/plain;charset=utf-8
```

Request:

```json
{
  "action": "saveEvaluation",
  "token": "demo-token",
  "workshopId": "WS3",
  "rating": 5,
  "feedback": "Phần thảo luận giúp tôi nhìn rõ cách phản ứng trong áp lực."
}
```

Response:

```json
{
  "ok": true,
  "mode": "updated",
  "evaluation": {
    "EvaluationID": "EVL-...",
    "UserID": "LDKT018",
    "WorkshopID": "WS3",
    "Rating": 5
  }
}
```

## Error Shape

```json
{
  "ok": false,
  "error": "Message"
}
```

## Notes

- Phase 1 chưa có auth phức tạp; dùng `Token` trong sheet `Users`.
- Phase 1 chưa gửi notification.
- Khi nối thật, frontend nên đọc `token` từ URL query hoặc invite link.
- `saveCheckin` upsert theo `UserID + ChallengeID`.
- `saveEvaluation` upsert theo `UserID + WorkshopID`.
