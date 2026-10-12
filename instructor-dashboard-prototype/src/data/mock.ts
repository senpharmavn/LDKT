export type Student = {
  id: string;
  name: string;
  department: string;
  workshop: number;
  progress: number;
  xp: number;
  streak: number;
  lastCheckin: string;
  evaluations: number;
  peerReviews: number;
  group: string;
  status: "Tốt" | "Cần chú ý" | "Chưa bắt đầu";
};

export const students: Student[] = [
  { id: "LDKT001", name: "Trần Phú Gia", department: "QA/QC", workshop: 7, progress: 86, xp: 520, streak: 9, lastCheckin: "Hôm nay, 08:42", evaluations: 8, peerReviews: 3, group: "Sen Bền Bỉ", status: "Tốt" },
  { id: "LDKT002", name: "Trần Thị Ngọc Thảo", department: "R&D", workshop: 7, progress: 92, xp: 580, streak: 12, lastCheckin: "Hôm nay, 07:50", evaluations: 9, peerReviews: 4, group: "Sen Bền Bỉ", status: "Tốt" },
  { id: "LDKT003", name: "Trần Ngọc Min Chan", department: "R&D", workshop: 6, progress: 71, xp: 470, streak: 6, lastCheckin: "Hôm qua, 21:10", evaluations: 7, peerReviews: 3, group: "Tâm Sáng", status: "Tốt" },
  { id: "LDKT004", name: "Võ Lê Ngọc Tuyền", department: "Kinh doanh", workshop: 5, progress: 54, xp: 330, streak: 2, lastCheckin: "3 ngày trước", evaluations: 5, peerReviews: 1, group: "Tâm Sáng", status: "Cần chú ý" },
  { id: "LDKT005", name: "Lâm Yến Phụng", department: "Nhân sự", workshop: 5, progress: 57, xp: 360, streak: 4, lastCheckin: "Hôm nay, 09:12", evaluations: 6, peerReviews: 2, group: "Hạt Mầm", status: "Tốt" },
  { id: "LDKT006", name: "Nguyễn Hoàng Vũ", department: "Sản xuất", workshop: 4, progress: 43, xp: 250, streak: 1, lastCheckin: "4 ngày trước", evaluations: 3, peerReviews: 0, group: "Chưa chọn", status: "Cần chú ý" },
  { id: "LDKT007", name: "Nguyễn Ngọc Bảo Nghi", department: "Marketing", workshop: 3, progress: 29, xp: 180, streak: 3, lastCheckin: "Hôm qua, 20:05", evaluations: 3, peerReviews: 1, group: "Hạt Mầm", status: "Tốt" },
  { id: "LDKT008", name: "Cao Ngọc Băng Tâm", department: "Tài chính", workshop: 1, progress: 8, xp: 40, streak: 0, lastCheckin: "Chưa check-in", evaluations: 1, peerReviews: 0, group: "Chưa chọn", status: "Chưa bắt đầu" },
];

export const workshops = [
  { id: "WS0", title: "Workshop trải nghiệm", date: "16/06", participation: 100, score: 4.6, onboard: 100, main: 100, share: 100 },
  { id: "WS1", title: "Lắng nghe", date: "17/06", participation: 96, score: 4.7, onboard: 100, main: 92, share: 83 },
  { id: "WS2", title: "Hiểu", date: "18/06", participation: 92, score: 4.4, onboard: 96, main: 88, share: 79 },
  { id: "WS3", title: "Học cách cảm thông", date: "19/06", participation: 88, score: 4.5, onboard: 92, main: 83, share: 75 },
  { id: "WS4", title: "Nhờ người khác feedback", date: "20/06", participation: 83, score: 4.2, onboard: 88, main: 79, share: 71 },
  { id: "WS5", title: "Học cách nhìn rộng", date: "21/06", participation: 75, score: 4.6, onboard: 83, main: 75, share: 67 },
  { id: "WS6", title: "Mở tâm", date: "22/06", participation: 67, score: 4.3, onboard: 75, main: 67, share: 58 },
  { id: "WS7", title: "Final", date: "23/06", participation: 50, score: 4.8, onboard: 63, main: 50, share: 38 },
];

export const groups = [
  { name: "Sen Bền Bỉ", members: ["Trần Phú Gia", "Trần Thị Ngọc Thảo"], meetings: 3, rate: 100, insight: "Phản hồi cần đi cùng quan sát cụ thể." },
  { name: "Tâm Sáng", members: ["Trần Ngọc Min Chan", "Võ Lê Ngọc Tuyền"], meetings: 2, rate: 67, insight: "Lắng nghe tốt hơn khi dừng việc chuẩn bị câu trả lời." },
  { name: "Hạt Mầm", members: ["Lâm Yến Phụng", "Nguyễn Ngọc Bảo Nghi"], meetings: 2, rate: 67, insight: "Nhóm cần thống nhất thời gian họp cố định." },
];

export const engagementTrend = [58, 66, 72, 68, 79, 83, 77, 88, 91, 84, 86, 89];
export const checkinTrend = [72, 76, 81, 69, 85, 88, 74];
