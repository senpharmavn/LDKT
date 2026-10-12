import type { Checkin } from "@/types/ldkt";

export function getProgramProgressPercent(currentWorkshop: number, totalWorkshops: number) {
  if (totalWorkshops <= 0) return 0;
  const completedBeforeCurrent = Math.max(0, Math.min(currentWorkshop - 1, totalWorkshops));
  return Math.round((completedBeforeCurrent / totalWorkshops) * 100);
}

export function getCompletedMiniChallengeCount(checkin: Checkin) {
  return checkin.status === "done" ? 2 : 1;
}
