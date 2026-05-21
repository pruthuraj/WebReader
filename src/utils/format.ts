import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function chapterOfText(idx: number, total: number) {
  return `Chapter ${idx} of ${total}`;
}

export function shortDate(ms: number) {
  return dayjs(ms).fromNow();
}

export function percentLabel(percent: number) {
  return `${Math.round(Math.max(0, Math.min(1, percent)) * 100)}%`;
}

