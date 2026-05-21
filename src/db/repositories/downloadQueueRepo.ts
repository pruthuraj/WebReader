import { all, run } from "../client";
import type { DownloadQueueItem, DownloadStatus } from "@/data/types";

interface QueueRow {
  novel_id: string;
  chapter_id: string;
  status: DownloadStatus;
  error: string | null;
  enqueued_at: number;
  updated_at: number;
}

function rowToItem(r: QueueRow): DownloadQueueItem {
  return {
    novelId: r.novel_id,
    chapterId: r.chapter_id,
    status: r.status,
    error: r.error,
    enqueuedAt: r.enqueued_at,
    updatedAt: r.updated_at,
  };
}

export const downloadQueueRepo = {
  async listAll(): Promise<DownloadQueueItem[]> {
    const rows = await all<QueueRow>(
      `SELECT * FROM download_queue ORDER BY enqueued_at ASC`
    );
    return rows.map(rowToItem);
  },

  async listByStatus(status: DownloadStatus): Promise<DownloadQueueItem[]> {
    const rows = await all<QueueRow>(
      `SELECT * FROM download_queue WHERE status = ? ORDER BY enqueued_at ASC`,
      [status]
    );
    return rows.map(rowToItem);
  },

  async enqueue(novelId: string, chapterId: string): Promise<void> {
    const now = Date.now();
    await run(
      `INSERT INTO download_queue (novel_id, chapter_id, status, error, enqueued_at, updated_at)
       VALUES (?, ?, 'queued', NULL, ?, ?)
       ON CONFLICT(novel_id, chapter_id) DO UPDATE SET
         status = CASE WHEN download_queue.status = 'done' THEN 'done' ELSE 'queued' END,
         error = NULL,
         updated_at = excluded.updated_at`,
      [novelId, chapterId, now, now]
    );
  },

  async setStatus(
    novelId: string,
    chapterId: string,
    status: DownloadStatus,
    error: string | null = null
  ): Promise<void> {
    await run(
      `UPDATE download_queue SET status = ?, error = ?, updated_at = ?
       WHERE novel_id = ? AND chapter_id = ?`,
      [status, error, Date.now(), novelId, chapterId]
    );
  },

  async remove(novelId: string, chapterId: string): Promise<void> {
    await run(
      `DELETE FROM download_queue WHERE novel_id = ? AND chapter_id = ?`,
      [novelId, chapterId]
    );
  },

  async clearDone(): Promise<void> {
    await run(`DELETE FROM download_queue WHERE status = 'done'`);
  },
};
