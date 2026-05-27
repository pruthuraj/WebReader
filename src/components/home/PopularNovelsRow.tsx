import { NovelRail } from "./NovelRail";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

export function PopularNovelsRow({ data }: { data: CountedNovelItem[] }) {
  return (
    <NovelRail
      title="Popular Novels"
      data={data}
      itemWidth={82}
      meta={(item) => `${item.count} opens`}
      emptyIcon="trending-up"
      emptyTitle="Popularity will appear once you start exploring"
      emptySubtitle="This is local popularity, not a network ranking."
    />
  );
}
