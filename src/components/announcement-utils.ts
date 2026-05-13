import { Announcement } from "@/docs-config-types";

export const ANNOUNCEMENT_HEIGHT_PX = 40;

export function isAnnouncementActive(announcement: Announcement): boolean {
  const now = new Date().toISOString().slice(0, 10);
  if (announcement.startDate && now < announcement.startDate) {
    return false;
  }
  if (announcement.endDate && now > announcement.endDate) {
    return false;
  }
  return true;
}
