import type { Challenge, Checkin, Evaluation, EvaluationQuestion, EvaluationTemplate, Student, Workshop } from "@/types/ldkt";

export const student: Student = {
  id: "LDKT018",
  name: "Trần Phú Gia",
  initials: "PG",
  batch: "K12",
  role: "Học viên",
  team: "QA/QC",
  email: "",
};

export const workshops: Workshop[] = [
  { title: "Workshop 1", description: "Nền tảng tư duy và nhận thức ban đầu", status: "done" },
  { title: "Workshop 2", description: "Hiểu bản thân và nhận diện thói quen phản ứng", status: "done" },
  { title: "Đánh giá đầu vào", description: "Tự đánh giá và gửi link đánh giá 360", status: "done" },
  { title: "Workshop 3", description: "Đọc sách nâng cao và tìm Insight", status: "now" },
  { title: "Workshop 4", description: "Mục đích sống", status: "locked" },
  { title: "Workshop 5", description: "Chấp nhận bản thân", status: "locked" },
  { title: "Workshop 6", description: "Đồng cảm sâu thật", status: "locked" },
  { title: "Workshop 7", description: "Mở rộng tâm lượng", status: "locked" },
  { title: "21-days challenge", description: "Mở sau khi hoàn thành hành trình workshop", status: "locked" },
];

export const challengeDays = [
  "Quan sát phản ứng",
  "Lắng nghe sâu",
  "Đặt một câu hỏi tốt",
  "Chọn phản hồi có chủ đích",
  "Tổng kết điều học được",
];

export const challenges: Challenge[] = challengeDays.map((title, index) => ({
  id: `MC3-D${index + 1}`,
  workshopId: "WS3",
  day: index + 1,
  title,
  description: title,
  instruction: "",
  status: "Active",
}));

export const defaultCheckin: Checkin = {
  status: "not_done",
  mood: "Tĩnh",
  insight: "",
  nextAction: "",
};

export const defaultEvaluation: Evaluation = {
  rating: 5,
  feedback: "",
};

export function getFallbackEvaluationTemplates(workshopId = "WS3", workshopTitle = "Workshop hiện tại"): EvaluationTemplate[] {
  return [
    {
      id: `${workshopId}-ONBOARD`,
      type: "workshop",
      workshopId,
      sessionType: "onboard",
      title: `${workshopTitle} - Onboard`,
      description: "Đánh giá phần mở đầu và định hướng buổi học",
      status: "active",
    },
    {
      id: `${workshopId}-MAIN`,
      type: "workshop",
      workshopId,
      sessionType: "main",
      title: `${workshopTitle} - Main`,
      description: "Đánh giá nội dung chính và mức độ ứng dụng",
      status: "active",
    },
    {
      id: `${workshopId}-SHARE`,
      type: "workshop",
      workshopId,
      sessionType: "share_learn",
      title: `${workshopTitle} - Share & Learn`,
      description: "Đánh giá phiên chia sẻ và học hỏi sau workshop",
      status: "active",
    },
    {
      id: "SELF-BEFORE",
      type: "self_before",
      workshopId: "",
      sessionType: "self",
      title: "Tự đánh giá đầu vào",
      description: "Nhìn lại năng lực lãnh đạo trước khi bắt đầu",
      status: "active",
    },
    {
      id: "OTHER-BEFORE",
      type: "peer",
      workshopId: "",
      sessionType: "peer",
      title: "Gửi link đánh giá 360",
      description: "Nhờ người khác góp ý về hành vi lãnh đạo",
      status: "locked",
    },
    {
      id: "SELF-AFTER",
      type: "self_after",
      workshopId: "",
      sessionType: "self",
      title: "Tự đánh giá cuối khóa",
      description: "So sánh sự thay đổi sau khi hoàn thành chương trình",
      status: "locked",
    },
  ];
}

export function getFallbackEvaluationQuestions(templateIds: string[]): EvaluationQuestion[] {
  return templateIds.flatMap((templateId) => [
    {
      id: `${templateId}-Q1`,
      templateId,
      order: 1,
      text: "Bạn đánh giá mức độ hữu ích của nội dung này như thế nào?",
      type: "rating",
      options: [],
      required: true,
      dimension: "usefulness",
    },
    {
      id: `${templateId}-Q2`,
      templateId,
      order: 2,
      text: "Điều quan trọng nhất bạn nhận ra là gì?",
      type: "text",
      options: [],
      required: true,
      dimension: "insight",
    },
    {
      id: `${templateId}-Q3`,
      templateId,
      order: 3,
      text: "Bạn tự tin áp dụng điều này ở mức nào?",
      type: "scale",
      options: ["1", "2", "3", "4", "5"],
      required: true,
      dimension: "application",
    },
  ]);
}
