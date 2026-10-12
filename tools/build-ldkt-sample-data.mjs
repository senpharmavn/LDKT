import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs", "ldkt_sample_data");
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();

const sheets = [
  {
    name: "README",
    rows: [
      ["LDKT sample data"],
      ["Copy từng sheet tương ứng sang Google Sheet backend để test dashboard giảng viên và app học viên."],
      ["Progress học viên hiện không tính đánh giá workshop. Công thức: Check-in 40, tham gia workshop 25, tự đánh giá 15, nhận đánh giá từ người khác 20."],
      ["Các dữ liệu được tạo để có đủ trạng thái Tốt / Cần chú ý / Chưa bắt đầu."],
    ],
  },
  {
    name: "Users",
    rows: [
      ["UserID", "FullName", "Email", "Phone", "CompanyName", "CohortID", "Role", "EnrollmentDate", "CurrentWorkshop", "ParticipationStatus", "Status", "Token", "XP", "LeadershipReportURL"],
      ["LDKT001", "Trần Phú Gia", "gia@example.com", "0379822527", "QA/QC", "CH001", "Học viên", "2026-06-24", 2, "Active", "Active", "TOK-001", 180, "https://lanhdaokhaitam.vercel.app/reports/Leadership_Report_Tran_Phu_Gia.pdf"],
      ["LDKT002", "Nguyễn Hoàng Vũ", "hoangvu@example.com", "0978525450", "RD", "CH001", "Học viên", "2026-06-24", 2, "Active", "Active", "TOK-002", 140, ""],
      ["LDKT003", "Trần Thị Ngọc Thảo", "thao@example.com", "0975692483", "RD", "CH001", "Học viên", "2026-06-24", 2, "Active", "Active", "TOK-003", 40, ""],
      ["LDKT004", "Đào Thị Hà Trang", "hatrang@example.com", "0362421299", "Kinh doanh", "CH001", "Học viên", "2026-06-24", 2, "Active", "Active", "TOK-004", 0, ""],
      ["LDKT005", "Đỗ Châu Khánh Tường", "tuong@example.com", "0948287034", "Marketing", "CH001", "Học viên", "2026-06-24", 2, "Active", "Active", "TOK-005", 90, ""],
      ["LDKT010", "Võ Lê Ngọc Châu", "coach@example.com", "", "SEN Pharma", "CH001", "Giảng viên", "2026-06-24", 2, "Active", "Active", "TOK-010", 0, ""],
    ],
  },
  {
    name: "Workshops",
    rows: [
      ["WorkshopID", "Title", "Description", "Order", "Status", "Flashcard URL", "Date", "ParticipantCount", "AttendanceRate", "EvaluationParticipationRate"],
      ["WS0", "Workshop 0", "Workshop trải nghiệm", 0, "done", "https://senpharmavn.github.io/ldp-knowledge-recap/", "2026-06-16", 5, 100, 80],
      ["WS1", "Workshop 1", "Lắng nghe", 1, "done", "https://senpharmavn.github.io/ldp-knowledge-recap/", "2026-06-17", 5, 100, 80],
      ["WS2", "Workshop 2", "Hiểu", 2, "now", "https://senpharmavn.github.io/ldp-knowledge-recap/", "2026-06-18", 4, 80, 60],
      ["WS3", "Workshop 3", "Học cách cảm thông", 3, "locked", "https://senpharmavn.github.io/ldp-knowledge-recap/", "2026-06-19", 0, 0, 0],
      ["WS7", "Workshop 7", "Final", 7, "locked", "https://senpharmavn.github.io/ldp-knowledge-recap/", "2026-06-23", 0, 0, 0],
    ],
  },
  {
    name: "Mini_Challenges",
    rows: [
      ["ChallengeID", "WorkshopID", "Day", "Title", "Description", "Instruction", "Status"],
      ["MC1-D1", "WS1", 1, "Mini Challenge 1-D1", "Lắng nghe chủ động", "Ghi lại một điều bạn nhận ra hôm nay.", "active"],
      ["MC1-D2", "WS1", 2, "Mini Challenge 1-D2", "Lắng nghe chủ động", "Ghi lại một điều bạn nhận ra hôm nay.", "active"],
      ["MC1-D3", "WS1", 3, "Mini Challenge 1-D3", "Lắng nghe chủ động", "Ghi lại một điều bạn nhận ra hôm nay.", "active"],
      ["MC1-D4", "WS1", 4, "Mini Challenge 1-D4", "Lắng nghe chủ động", "Ghi lại một điều bạn nhận ra hôm nay.", "active"],
      ["MC1-D5", "WS1", 5, "Mini Challenge 1-D5", "Lắng nghe chủ động", "Ghi lại một điều bạn nhận ra hôm nay.", "active"],
      ["MC2-D1", "WS2", 1, "Mini Challenge 2-D1", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D2", "WS2", 2, "Mini Challenge 2-D2", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D3", "WS2", 3, "Mini Challenge 2-D3", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D4", "WS2", 4, "Mini Challenge 2-D4", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D5", "WS2", 5, "Mini Challenge 2-D5", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D6", "WS2", 6, "Mini Challenge 2-D6", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D7", "WS2", 7, "Mini Challenge 2-D7", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D8", "WS2", 8, "Mini Challenge 2-D8", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D9", "WS2", 9, "Mini Challenge 2-D9", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
      ["MC2-D10", "WS2", 10, "Mini Challenge 2-D10", "Quan sát phản ứng", "Ghi lại phản ứng tự nhiên của bạn.", "active"],
    ],
  },
  {
    name: "Checkins",
    rows: [
      ["CheckinID", "UserID", "WorkshopID", "ChallengeID", "Day", "Completed", "Mood", "Insight", "NextAction", "CreatedAt", "UpdatedAt"],
      ["CHK-001-1", "LDKT001", "WS1", "MC1-D1", 1, true, "Tĩnh", "Tôi nhận ra mình hay phản hồi nhanh.", "Dừng 3 giây trước khi trả lời.", "2026-06-18T08:30:00.000Z", "2026-06-18T08:30:00.000Z"],
      ["CHK-001-2", "LDKT001", "WS1", "MC1-D2", 2, true, "Vui", "Tôi lắng nghe tốt hơn khi không chuẩn bị câu trả lời.", "Hỏi thêm một câu trước khi góp ý.", "2026-06-19T08:42:00.000Z", "2026-06-19T08:42:00.000Z"],
      ["CHK-001-3", "LDKT001", "WS2", "MC2-D1", 1, true, "Tĩnh", "Tôi dễ căng khi bị hỏi bất ngờ.", "Ghi lại trigger của mình.", "2026-06-25T08:42:00.000Z", "2026-06-25T08:42:00.000Z"],
      ["CHK-002-1", "LDKT002", "WS1", "MC1-D1", 1, true, "Tĩnh", "Tôi nghe rõ nhu cầu hơn khi tóm tắt lại.", "Tóm tắt trước khi phản hồi.", "2026-06-18T09:12:00.000Z", "2026-06-18T09:12:00.000Z"],
      ["CHK-002-2", "LDKT002", "WS2", "MC2-D1", 1, true, "Suy nghĩ", "Tôi hay phòng thủ khi nhận feedback.", "Hỏi: bạn kỳ vọng gì ở tôi?", "2026-06-24T21:10:00.000Z", "2026-06-24T21:10:00.000Z"],
      ["CHK-003-1", "LDKT003", "WS1", "MC1-D1", 1, false, "Mệt", "Hôm nay tôi chưa thực hành được.", "Ngày mai thử lại.", "2026-06-22T20:15:00.000Z", "2026-06-22T20:15:00.000Z"],
    ],
  },
  {
    name: "Evaluation_Templates",
    rows: [
      ["TemplateID", "Type", "WorkshopID", "SessionType", "Title", "Description", "Status", "FormURL"],
      ["WS1-MAIN", "workshop", "WS1", "main", "Workshop 1 - Main", "Đánh giá nội dung chính Workshop 1", "active", ""],
      ["WS2-MAIN", "workshop", "WS2", "main", "Workshop 2 - Main", "Đánh giá nội dung chính Workshop 2", "active", ""],
      ["SELF-BEFORE", "self_before", "", "self", "Tự đánh giá đầu chương trình", "30 câu hỏi tình huống", "active", ""],
      ["PEER-360", "peer", "", "peer", "Nhận đánh giá từ người khác", "Link đánh giá cá nhân hóa", "active", "https://forms.gle/example"],
      ["SELF-AFTER", "self_after", "", "self", "Tự đánh giá cuối chương trình", "Đánh giá sau chương trình", "locked", ""],
    ],
  },
  {
    name: "Evaluation_Questions",
    rows: [
      ["QuestionID", "TemplateID", "Order", "QuestionText", "QuestionType", "Options", "Required", "Dimension"],
      ["ALL1", "COMMON", 0, "Nội dung workshop rõ ràng, dễ hiểu", "rating", "1|2|3|4|5", true, "Rõ ràng"],
      ["ALL2", "COMMON", 0, "Chủ đề liên hệ thực tế công việc của tôi", "rating", "1|2|3|4|5", true, "Liên quan"],
      ["ALL3", "COMMON", 0, "Facilitator dẫn dắt hiệu quả", "rating", "1|2|3|4|5", true, "Facilitator"],
      ["ALL4", "COMMON", 0, "Tôi cảm thấy an toàn khi chia sẻ trong nhóm", "rating", "1|2|3|4|5", true, "An toàn chia sẻ"],
      ["WS1-MAIN-Q1", "WS1-MAIN", 1, "Điều quan trọng nhất bạn nhận ra là gì?", "text", "", true, "Insight"],
      ["WS2-MAIN-Q1", "WS2-MAIN", 1, "Bạn sẽ áp dụng điều gì sau workshop?", "text", "", true, "Ứng dụng"],
    ],
  },
  {
    name: "Evaluation_Responses",
    rows: [
      ["ResponseID", "UserID", "TemplateID", "WorkshopID", "SessionType", "RespondentType", "Rating", "Feedback", "CreatedAt", "UpdatedAt"],
      ["EVR-001", "LDKT001", "SELF-BEFORE", "", "self", "self", 0, "Hoàn thành tự đánh giá đầu chương trình", "2026-06-18T10:00:00.000Z", "2026-06-18T10:00:00.000Z"],
      ["EVR-002", "LDKT001", "PEER-360", "", "peer", "peer", 0, "Peer 1", "2026-06-19T10:00:00.000Z", "2026-06-19T10:00:00.000Z"],
      ["EVR-003", "LDKT001", "PEER-360", "", "peer", "peer", 0, "Peer 2", "2026-06-20T10:00:00.000Z", "2026-06-20T10:00:00.000Z"],
      ["EVR-004", "LDKT001", "PEER-360", "", "peer", "peer", 0, "Peer 3", "2026-06-21T10:00:00.000Z", "2026-06-21T10:00:00.000Z"],
      ["EVR-005", "LDKT002", "SELF-BEFORE", "", "self", "self", 0, "Hoàn thành tự đánh giá đầu chương trình", "2026-06-19T10:00:00.000Z", "2026-06-19T10:00:00.000Z"],
      ["EVR-006", "LDKT002", "PEER-360", "", "peer", "peer", 0, "Peer 1", "2026-06-20T10:00:00.000Z", "2026-06-20T10:00:00.000Z"],
      ["EVR-007", "LDKT001", "WS1-MAIN", "WS1", "main", "self", 5, "Workshop thực tế và hữu ích.", "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["EVR-008", "LDKT002", "WS1-MAIN", "WS1", "main", "self", 4, "Cần thêm ví dụ.", "2026-06-18T12:05:00.000Z", "2026-06-18T12:05:00.000Z"],
      ["EVR-009", "LDKT001", "WS2-MAIN", "WS2", "main", "self", 4, "Bài tập phản tư hữu ích.", "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
    ],
  },
  {
    name: "Evaluation_Answers",
    rows: [
      ["AnswerID", "ResponseID", "UserID", "TemplateID", "QuestionID", "Value", "CreatedAt", "UpdatedAt"],
      ["ANS-001", "EVR-007", "LDKT001", "WS1-MAIN", "ALL1", 5, "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["ANS-002", "EVR-007", "LDKT001", "WS1-MAIN", "ALL2", 5, "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["ANS-003", "EVR-007", "LDKT001", "WS1-MAIN", "ALL3", 4, "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["ANS-004", "EVR-007", "LDKT001", "WS1-MAIN", "ALL4", 4, "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["ANS-005", "EVR-007", "LDKT001", "WS1-MAIN", "WS1-MAIN-Q1", "Tôi nhận ra mình cần nghe hết ý trước khi phản hồi.", "2026-06-18T12:00:00.000Z", "2026-06-18T12:00:00.000Z"],
      ["ANS-006", "EVR-008", "LDKT002", "WS1-MAIN", "ALL1", 4, "2026-06-18T12:05:00.000Z", "2026-06-18T12:05:00.000Z"],
      ["ANS-007", "EVR-008", "LDKT002", "WS1-MAIN", "ALL2", 4, "2026-06-18T12:05:00.000Z", "2026-06-18T12:05:00.000Z"],
      ["ANS-008", "EVR-008", "LDKT002", "WS1-MAIN", "ALL3", 5, "2026-06-18T12:05:00.000Z", "2026-06-18T12:05:00.000Z"],
      ["ANS-009", "EVR-008", "LDKT002", "WS1-MAIN", "ALL4", 3, "2026-06-18T12:05:00.000Z", "2026-06-18T12:05:00.000Z"],
      ["ANS-010", "EVR-009", "LDKT001", "WS2-MAIN", "ALL1", 4, "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
      ["ANS-011", "EVR-009", "LDKT001", "WS2-MAIN", "ALL2", 5, "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
      ["ANS-012", "EVR-009", "LDKT001", "WS2-MAIN", "ALL3", 4, "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
      ["ANS-013", "EVR-009", "LDKT001", "WS2-MAIN", "ALL4", 3, "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
      ["ANS-014", "EVR-009", "LDKT001", "WS2-MAIN", "WS2-MAIN-Q1", "Tôi sẽ hỏi lại kỳ vọng trước khi phản ứng.", "2026-06-19T12:00:00.000Z", "2026-06-19T12:00:00.000Z"],
    ],
  },
  {
    name: "Peer_Group_List",
    rows: [
      ["GroupID", "GroupName", "MaxMembers", "Status"],
      ["G01", "Sen Bền Bỉ", 4, "active"],
      ["G02", "Tâm Sáng", 4, "active"],
    ],
  },
  {
    name: "Peer_Groups",
    rows: [
      ["GroupID", "GroupName", "UserID", "Role", "Status"],
      ["G01", "Sen Bền Bỉ", "LDKT001", "member", "active"],
      ["G01", "Sen Bền Bỉ", "LDKT002", "member", "active"],
      ["G02", "Tâm Sáng", "LDKT003", "member", "active"],
      ["G02", "Tâm Sáng", "LDKT004", "member", "active"],
    ],
  },
  {
    name: "Group_Checkins",
    rows: [
      ["CheckinID", "GroupID", "Week", "UserID", "Met", "Insight", "NextAction", "CreatedAt"],
      ["GCHK-001", "G01", 1, "LDKT001", true, "Nhóm thống nhất hỏi thêm trước khi góp ý.", "Hẹn tuần sau cùng giờ.", "2026-06-20T20:00:00.000Z"],
      ["GCHK-002", "G01", 2, "LDKT002", true, "Nhóm chia sẻ cách nhận feedback bình tĩnh hơn.", "Mỗi người thử một câu hỏi mở.", "2026-06-27T20:00:00.000Z"],
      ["GCHK-003", "G02", 1, "LDKT003", false, "Nhóm chưa gặp trực tiếp.", "Chốt lịch cụ thể.", "2026-06-20T20:30:00.000Z"],
    ],
  },
  {
    name: "Assessment_Summary",
    rows: [
      ["UserID", "Dimension", "SelfScore", "PeerScore", "Insight", "CompletedAt"],
      ["LDKT001", "Tôi hiện diện", 3.1, 3.8, "Người khác nhìn thấy sự bình tĩnh của bạn rõ hơn bạn tự cảm nhận.", "2026-06-21T10:00:00.000Z"],
      ["LDKT001", "Tôi kết nối", 2.8, 3.4, "Bạn có tiềm năng tạo kết nối nếu tiếp tục lắng nghe chủ động.", "2026-06-21T10:00:00.000Z"],
      ["LDKT001", "Tôi đạt mục tiêu", 2.9, 3.2, "Bạn đang dịch chuyển từ phản ứng sang lựa chọn có chủ đích.", "2026-06-21T10:00:00.000Z"],
    ],
  },
];

for (const config of sheets) {
  const sheet = workbook.worksheets.add(config.name);
  const rowCount = config.rows.length;
  const colCount = Math.max(...config.rows.map((row) => row.length));
  const normalized = config.rows.map((row) => [...row, ...Array(colCount - row.length).fill("")]);
  sheet.getRangeByIndexes(0, 0, rowCount, colCount).values = normalized;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const used = sheet.getRangeByIndexes(0, 0, rowCount, colCount);
  used.format = {
    font: { name: "Arial", size: 10, color: "#17233B" },
    borders: { preset: "insideHorizontal", style: "thin", color: "#DDE5E1" },
  };
  sheet.getRangeByIndexes(0, 0, 1, colCount).format = {
    fill: "#178775",
    font: { bold: true, color: "#FFFFFF" },
  };
  used.format.autofitColumns();
  used.format.autofitRows();
}

const readme = workbook.worksheets.getItem("README");
readme.getRange("A1").format = { font: { bold: true, size: 16, color: "#0C5F53" } };
readme.getRange("A1:A4").format.columnWidthPx = 780;
readme.getRange("A1:A4").format.wrapText = true;
readme.getRange("A2:A4").format.rowHeightPx = 34;

const preview = await workbook.render({ sheetName: "Users", range: "A1:N8", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "users_preview.png"), new Uint8Array(await preview.arrayBuffer()));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "LDKT_dashboard_sample_data.xlsx"));
