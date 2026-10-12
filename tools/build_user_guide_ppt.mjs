import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "C:/Users/Admin/Documents/LDKT/outputs";
const PPTX_PATH = `${OUT_DIR}/LDKT_User_Guide_Release.pptx`;
const PREVIEW_DIR = `${OUT_DIR}/user-guide-preview`;

const W = 1280;
const H = 720;

const c = {
  navy: "#14142E",
  green: "#108A73",
  deepGreen: "#006B5B",
  mint: "#E7F7F1",
  paleMint: "#F3FBF8",
  gold: "#D9B43B",
  cream: "#F8F3EA",
  ink: "#07142F",
  slate: "#667085",
  light: "#E8EEE9",
  white: "#FFFFFF",
};

function shape(slide, geometry, position, fill = "none", lineFill = "none", width = 0) {
  return slide.shapes.add({
    geometry,
    position,
    fill,
    line: { style: "solid", fill: lineFill, width },
  });
}

function text(slide, value, position, style = {}) {
  const box = shape(slide, "textbox", position, "none");
  box.text = value;
  box.text.style = {
    fontFace: "Aptos",
    fontSize: 20,
    color: c.ink,
    ...style,
  };
  return box;
}

function card(slide, x, y, w, h, fill = c.white, line = "#DDE7E0") {
  return shape(slide, "roundRect", { left: x, top: y, width: w, height: h }, fill, line, 1);
}

function pill(slide, label, x, y, w, fill = c.mint, color = c.green) {
  card(slide, x, y, w, 34, fill, fill);
  text(slide, label, { left: x + 18, top: y + 7, width: w - 36, height: 22 }, {
    fontSize: 13,
    bold: true,
    color,
  });
}

function header(slide, title, section = "Lãnh Đạo Khai Tâm") {
  shape(slide, "rect", { left: 0, top: 0, width: W, height: 88 }, c.navy);
  text(slide, title, { left: 72, top: 27, width: 780, height: 42 }, {
    fontSize: 32,
    bold: true,
    color: c.white,
  });
  text(slide, section, { left: 900, top: 31, width: 300, height: 32 }, {
    fontSize: 16,
    bold: true,
    color: "#FFE88C",
    align: "right",
  });
}

function footer(slide, n) {
  text(slide, `Release guide · ${String(n).padStart(2, "0")}`, { left: 72, top: 676, width: 240, height: 22 }, {
    fontSize: 12,
    color: c.slate,
  });
}

function bullets(slide, items, x, y, w, size = 20, gap = 34, color = c.ink) {
  items.forEach((item, i) => {
    shape(slide, "ellipse", { left: x, top: y + i * gap + 8, width: 9, height: 9 }, c.green);
    text(slide, item, { left: x + 24, top: y + i * gap, width: w - 24, height: gap }, {
      fontSize: size,
      color,
    });
  });
}

function metric(slide, x, y, label, value, note, accent = c.green) {
  card(slide, x, y, 250, 126, c.white);
  shape(slide, "ellipse", { left: x + 22, top: y + 24, width: 42, height: 42 }, c.mint);
  text(slide, value, { left: x + 82, top: y + 24, width: 138, height: 34 }, {
    fontSize: 30,
    bold: true,
    color: accent,
  });
  text(slide, label, { left: x + 82, top: y + 63, width: 150, height: 24 }, {
    fontSize: 15,
    bold: true,
    color: c.ink,
  });
  text(slide, note, { left: x + 82, top: y + 90, width: 145, height: 24 }, {
    fontSize: 12,
    color: c.slate,
  });
}

function roleCard(slide, x, y, title, subtitle, points, accent = c.green) {
  card(slide, x, y, 350, 355, c.white);
  shape(slide, "ellipse", { left: x + 26, top: y + 28, width: 62, height: 62 }, c.mint);
  text(slide, title, { left: x + 108, top: y + 28, width: 210, height: 30 }, {
    fontSize: 24,
    bold: true,
    color: accent,
  });
  text(slide, subtitle, { left: x + 108, top: y + 62, width: 205, height: 42 }, {
    fontSize: 14,
    color: c.slate,
  });
  bullets(slide, points, x + 34, y + 128, 286, 17, 42);
}

const slides = [];
const deck = Presentation.create({ slideSize: { width: W, height: H } });

function addSlide(title, draw) {
  const slide = deck.slides.add();
  slide.background.fill = c.cream;
  draw(slide);
  slides.push(slide);
}

addSlide("cover", (s) => {
  s.background.fill = c.navy;
  shape(s, "ellipse", { left: 930, top: -90, width: 430, height: 430 }, "#272849");
  shape(s, "ellipse", { left: -120, top: 510, width: 360, height: 360 }, "#0E5F55");
  pill(s, "RELEASE USER GUIDE", 72, 86, 190, "#22304A", "#FFE88C");
  text(s, "Lãnh Đạo Khai Tâm", { left: 72, top: 170, width: 780, height: 64 }, {
    fontSize: 52,
    bold: true,
    color: "#FFE88C",
  });
  text(s, "Hướng dẫn sử dụng app học viên, dashboard giảng viên và vận hành admin", { left: 72, top: 250, width: 800, height: 86 }, {
    fontSize: 26,
    color: c.white,
  });
  card(s, 72, 420, 720, 128, "#1D1E3D", "#333456");
  text(s, "Mục tiêu release", { left: 110, top: 445, width: 240, height: 30 }, {
    fontSize: 18,
    bold: true,
    color: "#FFE88C",
  });
  text(s, "Giúp học viên thao tác mỗi ngày dễ hơn, giảng viên theo dõi cohort rõ hơn, admin vận hành bằng Google Sheet trong giai đoạn MVP.", { left: 110, top: 480, width: 620, height: 48 }, {
    fontSize: 20,
    color: c.white,
  });
  text(s, "SEN Pharma · Learning Journey Platform", { left: 72, top: 632, width: 460, height: 28 }, {
    fontSize: 16,
    color: "#BFDCD5",
  });
});

addSlide("roles", (s) => {
  header(s, "Một hệ thống, ba vai trò");
  roleCard(s, 72, 170, "Học viên", "Dùng trên điện thoại, thao tác hằng ngày", [
    "Đăng nhập bằng email/số điện thoại và mã học viên",
    "Check-in Mini Challenge, xem hành trình, tài liệu và insight",
    "Thực hiện Leadership Assessment và xem báo cáo khi được mở",
  ]);
  roleCard(s, 465, 170, "Giảng viên", "Dùng trên laptop để theo dõi cohort", [
    "Xem tiến độ học viên, chất lượng workshop, Mini Challenge",
    "Theo dõi nhóm đồng hành và các học viên cần hỗ trợ",
    "Tạo và mở báo cáo Leadership Assessment khi đủ dữ liệu",
  ], "#2E65D1");
  roleCard(s, 858, 170, "Admin", "Quản lý dữ liệu và trạng thái trên Google Sheet", [
    "Mở/khóa workshop, form đánh giá và nội dung học tập",
    "Quản lý Users, Student_Stats, Assessment_Summary",
    "Kiểm tra dữ liệu trước khi release hoặc gửi báo cáo",
  ], c.gold);
  footer(s, 2);
});

addSlide("student-journey", (s) => {
  header(s, "Luồng sử dụng của học viên");
  const steps = [
    ["1", "Đăng nhập", "Email/số điện thoại + mã học viên"],
    ["2", "Home", "Xem workshop hiện tại, XP, streak và leaderboard"],
    ["3", "Mini Challenge", "Check-in, ghi insight và hành động tiếp theo"],
    ["4", "Hành trình", "Xem lộ trình, tài liệu và các mốc cần làm"],
    ["5", "Đánh giá", "Workshop, tự đánh giá và mời người khác đánh giá"],
    ["6", "Hồ sơ", "Xem mã học viên và báo cáo khi được publish"],
  ];
  let x = 76;
  steps.forEach((st, i) => {
    card(s, x, i % 2 === 0 ? 165 : 325, 170, 150, c.white);
    shape(s, "ellipse", { left: x + 18, top: (i % 2 === 0 ? 188 : 348), width: 46, height: 46 }, i < 3 ? c.green : c.gold);
    text(s, st[0], { left: x + 32, top: (i % 2 === 0 ? 198 : 358), width: 20, height: 24 }, {
      fontSize: 18,
      bold: true,
      color: c.white,
      align: "center",
    });
    text(s, st[1], { left: x + 18, top: (i % 2 === 0 ? 252 : 412), width: 134, height: 26 }, {
      fontSize: 19,
      bold: true,
      color: c.ink,
    });
    text(s, st[2], { left: x + 18, top: (i % 2 === 0 ? 286 : 446), width: 134, height: 52 }, {
      fontSize: 13,
      color: c.slate,
    });
    if (i < steps.length - 1) {
      shape(s, "chevron", { left: x + 184, top: 286, width: 35, height: 35 }, "#D4E5DD");
    }
    x += 195;
  });
  text(s, "Nguyên tắc UX", { left: 92, top: 552, width: 220, height: 28 }, { fontSize: 22, bold: true, color: c.green });
  bullets(s, [
    "Không hiện thuật ngữ kỹ thuật như Google Sheet cho học viên.",
    "Tải dữ liệu theo từng màn hình để giảm cảm giác chờ.",
    "Các task đã hoàn tất không gây nhiễu, chỉ giữ thông tin có ích trong ngày.",
  ], 95, 592, 950, 18, 28);
  footer(s, 3);
});

addSlide("student-home", (s) => {
  header(s, "App học viên: dùng mỗi ngày");
  metric(s, 72, 138, "Workshop", "Now", "Mốc hiện tại", c.green);
  metric(s, 342, 138, "XP", "+20", "Sau check-in", c.gold);
  metric(s, 612, 138, "Streak", "Dài nhất", "Chuỗi tốt nhất", "#7B61FF");
  metric(s, 882, 138, "Leaderboard", "Top", "Theo XP", "#2E65D1");
  card(s, 72, 320, 500, 250, c.white);
  text(s, "Mini Challenge", { left: 108, top: 354, width: 250, height: 34 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Chỉ mở khi workshop tương ứng đang now và đến ngày challenge.",
    "Ngày đã check-in: xanh; ngày đã qua mà bỏ lỡ: xám đậm.",
    "Insight cá nhân được lưu riêng cho người học.",
  ], 110, 405, 390, 18, 38);
  card(s, 620, 320, 500, 250, c.white);
  text(s, "Learning & Hành trình", { left: 656, top: 354, width: 330, height: 34 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Workshop done/now có thể mở tài liệu học tập.",
    "Nhóm đồng hành chỉ mở trong giai đoạn 21-days challenge.",
    "Người đã hoàn thành cohort vẫn xem được tài liệu và insight.",
  ], 658, 405, 395, 18, 38);
  footer(s, 4);
});

addSlide("assessment", (s) => {
  header(s, "Leadership Assessment");
  card(s, 72, 140, 520, 430, c.white);
  pill(s, "SELF", 110, 176, 84);
  text(s, "Tự đánh giá", { left: 110, top: 224, width: 380, height: 38 }, { fontSize: 30, bold: true, color: c.ink });
  bullets(s, [
    "30 câu hỏi tình huống theo hướng Phản ứng → Sáng tạo.",
    "Câu trả lời lưu dạng reactive hoặc creative.",
    "Hướng dẫn: chọn phương án sát với suy nghĩ, cảm xúc thực tế bên trong.",
  ], 112, 292, 400, 19, 46);
  card(s, 664, 140, 520, 430, c.white);
  pill(s, "OTHER", 702, 176, 102, "#EEF3FF", "#2E65D1");
  text(s, "Mời người khác đánh giá", { left: 702, top: 224, width: 410, height: 38 }, { fontSize: 30, bold: true, color: c.ink });
  bullets(s, [
    "Học viên copy link cá nhân hóa và gửi cho người đánh giá.",
    "Người đánh giá trả lời 30 câu + câu hỏi mở.",
    "Tối thiểu 3 lượt để báo cáo sẵn sàng, nhưng có thể nhận nhiều hơn.",
  ], 704, 292, 400, 19, 46);
  footer(s, 5);
});

addSlide("report", (s) => {
  header(s, "Báo cáo Leadership Assessment");
  card(s, 72, 140, 510, 430, c.white);
  text(s, "Quy tắc mở báo cáo", { left: 112, top: 174, width: 360, height: 34 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Khi có 1 self + tối thiểu 3 other, trạng thái chuyển data_ready/ready.",
    "Giảng viên/admin bấm tạo report khi thấy dữ liệu đã đủ.",
    "Link report được lưu vào Users → LeadershipReportLink.",
    "Học viên mở báo cáo từ Hồ sơ, không tạo report live mỗi lần vào app.",
  ], 114, 240, 390, 18, 43);
  card(s, 640, 140, 520, 430, c.white);
  text(s, "Cách đọc báo cáo", { left: 680, top: 174, width: 360, height: 34 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Giữ bản laptop để trình bày đầy đủ.",
    "Bản mobile ưu tiên card theo từng khía cạnh, dễ đọc trên điện thoại.",
    "Tô màu xanh/cam/tím/trắng theo mức alignment và xu hướng.",
    "Insight nổi bật lấy từ câu hỏi mở của người khác đánh giá.",
  ], 682, 240, 400, 18, 43);
  footer(s, 6);
});

addSlide("instructor", (s) => {
  header(s, "Dashboard giảng viên");
  const blocks = [
    ["Tổng quan", "Cohort health, engagement, practice, assessment, học viên cần chú ý"],
    ["Học viên", "Danh sách học viên, XP, streak, check-in, số lượt nhận đánh giá"],
    ["Workshop Quality", "Tỉ lệ tham gia, tỉ lệ đánh giá, điểm ALL1-ALL4 và phản hồi văn bản"],
    ["Mini Challenge", "Tỉ lệ check-in, hoàn thành >=80%, dưới 80%, bỏ cuộc 21-days challenge"],
    ["Nhóm đồng hành", "Nhóm, thành viên, tuần đã check-in; không cần xem insight cá nhân"],
    ["Báo cáo", "Tạo report, publish link, theo dõi trạng thái report từng học viên"],
  ];
  blocks.forEach((b, i) => {
    const x = 72 + (i % 3) * 380;
    const y = 150 + Math.floor(i / 3) * 205;
    card(s, x, y, 330, 160, c.white);
    shape(s, "ellipse", { left: x + 24, top: y + 26, width: 44, height: 44 }, i % 2 ? "#EEF3FF" : c.mint);
    text(s, b[0], { left: x + 86, top: y + 28, width: 210, height: 30 }, { fontSize: 22, bold: true, color: c.green });
    text(s, b[1], { left: x + 86, top: y + 70, width: 200, height: 58 }, { fontSize: 15, color: c.slate });
  });
  footer(s, 7);
});

addSlide("admin-sheets", (s) => {
  header(s, "Admin: Google Sheet là bảng điều khiển");
  const rows = [
    ["Users", "Học viên, token, trạng thái, XP, report link, điểm danh workshop"],
    ["Workshops", "Ngày học, trạng thái now/done/locked, link tài liệu"],
    ["Mini_Challenges", "Challenge theo workshop, số ngày, ngày bắt đầu"],
    ["Evaluation_Templates", "Mở/khóa self, other, workshop evaluation"],
    ["Evaluation_Questions", "Câu hỏi workshop, 30 tình huống, câu hỏi mở"],
    ["Student_Stats", "Bảng tổng hợp nhẹ cho app học viên và leaderboard"],
    ["Assessment_Summary", "Dữ liệu report sau khi rebuild từ đánh giá"],
  ];
  card(s, 72, 135, 1136, 480, c.white);
  rows.forEach((r, i) => {
    const y = 170 + i * 58;
    if (i > 0) shape(s, "rect", { left: 110, top: y - 16, width: 1030, height: 1 }, "#E5E7EB");
    text(s, r[0], { left: 115, top: y, width: 240, height: 26 }, { fontSize: 20, bold: true, color: c.green });
    text(s, r[1], { left: 365, top: y, width: 720, height: 26 }, { fontSize: 18, color: c.ink });
  });
  footer(s, 8);
});

addSlide("release-flow", (s) => {
  header(s, "Quy trình vận hành release");
  const phases = [
    ["Trước cohort", ["Nhập Users", "Kiểm tra token/mã học viên", "Set workshop và templates locked/active"]],
    ["Trong cohort", ["Mở workshop/mini challenge theo lịch", "Theo dõi check-in và dashboard", "Hỗ trợ học viên cần chú ý"]],
    ["Sau assessment", ["Khóa form khi đủ dữ liệu", "Rebuild summary", "Tạo report và publish link"]],
  ];
  phases.forEach((p, i) => {
    const x = 85 + i * 390;
    card(s, x, 160, 330, 360, c.white);
    pill(s, `Giai đoạn ${i + 1}`, x + 28, 196, 118, i === 0 ? c.mint : i === 1 ? "#FFF3CF" : "#EEF3FF", i === 1 ? "#9A6D00" : c.green);
    text(s, p[0], { left: x + 28, top: 250, width: 250, height: 34 }, { fontSize: 27, bold: true, color: c.ink });
    bullets(s, p[1], x + 32, 322, 250, 18, 44);
  });
  footer(s, 9);
});

addSlide("data-performance", (s) => {
  header(s, "Tối ưu tốc độ và dữ liệu");
  card(s, 72, 140, 520, 410, c.white);
  text(s, "Hiện tại: Google Sheet", { left: 112, top: 178, width: 360, height: 32 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Nhanh triển khai và dễ để admin tự sửa nội dung.",
    "Dữ liệu đọc theo màn hình để giảm tải cho app học viên.",
    "Student_Stats giúp leaderboard, XP, streak không phải quét toàn bộ sheet.",
  ], 114, 250, 390, 18, 46);
  card(s, 640, 140, 520, 410, c.white);
  text(s, "Sau này: Firebase/app native", { left: 680, top: 178, width: 400, height: 32 }, { fontSize: 28, bold: true, color: c.green });
  bullets(s, [
    "Phù hợp khi cần bảo mật dữ liệu cá nhân tốt hơn.",
    "Ổn định hơn cho cohort lớn, notification và app iOS/Android.",
    "Cần thêm thời gian thiết kế quyền truy cập, database và migration.",
  ], 682, 250, 390, 18, 46);
  footer(s, 10);
});

addSlide("avatar", (s) => {
  header(s, "Avatar học viên: khuyến nghị release");
  card(s, 96, 150, 500, 370, c.white);
  text(s, "Không nên upload ảnh trực tiếp ở giai đoạn này", { left: 132, top: 190, width: 390, height: 70 }, {
    fontSize: 28,
    bold: true,
    color: c.ink,
  });
  bullets(s, [
    "Upload ảnh làm tăng yêu cầu lưu trữ, quyền riêng tư và kiểm duyệt nội dung.",
    "Nếu dùng Google Sheet, quản lý file ảnh sẽ dễ phát sinh lỗi link/quyền xem.",
    "Giữ avatar chữ cái hoặc màu nhận diện là nhẹ và đủ cho MVP.",
  ], 136, 292, 380, 18, 44);
  card(s, 684, 150, 500, 370, c.white);
  text(s, "Nếu vẫn muốn có ảnh", { left: 720, top: 190, width: 300, height: 40 }, {
    fontSize: 28,
    bold: true,
    color: c.green,
  });
  bullets(s, [
    "Thêm cột AvatarURL trong Users.",
    "Admin upload ảnh lên Drive/CDN và dán link đã public.",
    "App chỉ đọc ảnh, không cho học viên upload trực tiếp.",
  ], 724, 292, 370, 18, 44);
  footer(s, 11);
});

addSlide("launch-checklist", (s) => {
  header(s, "Checklist trước khi gửi team trải nghiệm");
  const checks = [
    "Apps Script đã deploy đúng URL mới nhất.",
    "Users có UserID, Email/Phone, Token, Status Active.",
    "Workshop đang mở đúng trạng thái now; link tài liệu hoạt động.",
    "Evaluation_Templates chỉ active những form cần mở.",
    "Student_Stats đã rebuild sau khi có dữ liệu mới.",
    "LeadershipReportLink đã có cho học viên được publish report.",
    "Test 1 tài khoản học viên từ điện thoại thật.",
    "Test dashboard giảng viên trên laptop.",
  ];
  card(s, 72, 140, 1136, 438, c.white);
  checks.forEach((item, i) => {
    const col = i < 4 ? 0 : 1;
    const x = col === 0 ? 120 : 650;
    const y = 188 + (i % 4) * 86;
    shape(s, "roundRect", { left: x, top: y, width: 42, height: 42 }, c.mint);
    text(s, "✓", { left: x + 10, top: y + 7, width: 22, height: 24 }, { fontSize: 20, bold: true, color: c.green, align: "center" });
    text(s, item, { left: x + 62, top: y + 5, width: 420, height: 42 }, { fontSize: 19, color: c.ink });
  });
  text(s, "Deck này dùng để trình bày release, không thay thế tài liệu vận hành chi tiết.", { left: 72, top: 620, width: 880, height: 28 }, {
    fontSize: 16,
    color: c.slate,
  });
  footer(s, 12);
});

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.rm(PREVIEW_DIR, { recursive: true, force: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(PREVIEW_DIR, `${stem}.png`), await deck.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(PREVIEW_DIR, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(path.join(PREVIEW_DIR, "deck-montage.webp"), await deck.export({ format: "webp", montage: true, scale: 1 }));

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(PPTX_PATH);
  console.log(PPTX_PATH);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
