import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useReaderStore } from "@/stores/readerStore";

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

interface UseProgressAutoSaveOptions {
  novelId: string;
  chapterId: string;
  contentHeight: number;
}

export function useProgressAutoSave({
  novelId,
  chapterId,
  contentHeight,
}: UseProgressAutoSaveOptions) {
  const [lastSavedPercent, setLastSavedPercent] = useState(0);
  const lastWriteAt = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { y } = event.nativeEvent.contentOffset;
      const viewportHeight = event.nativeEvent.layoutMeasurement.height;
      const maxScrollable = Math.max(1, contentHeight - viewportHeight);
      const percent = clampPercent(y / maxScrollable);

      useReaderStore.getState().setScrollOffset(y);

      const now = Date.now();
      if (now - lastWriteAt.current < 750) return;

      lastWriteAt.current = now;
      setLastSavedPercent(percent);
      void useReaderStore.getState().setProgress(novelId, chapterId, y, percent);
    },
    [chapterId, contentHeight, novelId]
  );

  return { onScroll, lastSavedPercent };
}

