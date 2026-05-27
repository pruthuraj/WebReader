import { NovelRail } from "./NovelRail";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

export function RecentlyOpenedRow({ data }: { data: CountedNovelItem[] }) {
  return (
    <NovelRail
      title="Recently Opened"
      data={data}
      itemWidth={96}
      emptyIcon="clock"
      emptyTitle="Open a novel to see it here"
      emptySubtitle="Your recent catalogue visits stay on this device."
    />
  );
}
