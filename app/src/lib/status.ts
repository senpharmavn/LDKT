import type { WorkshopStatus } from "@/types/ldkt";

export function workshopStatusLabel(status: WorkshopStatus) {
  if (status === "done") return "Hoàn thành";
  if (status === "now") return "Đang học";
  return "Chưa mở";
}
