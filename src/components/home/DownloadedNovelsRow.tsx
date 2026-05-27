import { NovelRail } from "./NovelRail";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

export function DownloadedNovelsRow({ data }: { data: CountedNovelItem[] }) {
  return (
    <NovelRail
      title="Downloaded"
      data={data}
      itemWidth={82}
      meta={(item) => `${item.count} ch.`}
      emptyIcon="download"
      emptyTitle="Open a chapter to keep it offline"
      emptySubtitle="Chapter bodies are stored when you read them."
    />
  );
}
