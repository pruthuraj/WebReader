export const SCHEMA_VERSION = 3;

export const MIGRATIONS: string[] = [
  `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS novels (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    source TEXT,
    language TEXT,
    description TEXT,
    tags TEXT,
    cover_hint TEXT,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chapters (
    novel_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    downloaded_at INTEGER,
    PRIMARY KEY (novel_id, chapter_id),
    FOREIGN KEY (novel_id) REFERENCES novels(id)
  );
  CREATE INDEX IF NOT EXISTS idx_chapters_novel_idx ON chapters(novel_id, idx);

  CREATE TABLE IF NOT EXISTS progress (
    novel_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    scroll_offset REAL NOT NULL,
    percent REAL NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (novel_id, chapter_id)
  );
  CREATE INDEX IF NOT EXISTS idx_progress_updated ON progress(updated_at DESC);

  CREATE TABLE IF NOT EXISTS download_queue (
    novel_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    enqueued_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (novel_id, chapter_id)
  );
  CREATE INDEX IF NOT EXISTS idx_queue_status ON download_queue(status);

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT,
    duration_ms INTEGER,
    novel_id TEXT,
    chapter_id TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_type_time ON events(type, created_at);

  CREATE TABLE IF NOT EXISTS kv_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS pronunciation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    is_regex INTEGER NOT NULL DEFAULT 0,
    replacement TEXT NOT NULL,
    language TEXT,
    case_sensitive INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    category TEXT,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_pronun_enabled_lang
    ON pronunciation_rules(enabled, language);
  CREATE INDEX IF NOT EXISTS idx_pronun_category
    ON pronunciation_rules(category);
  `,
  `
  -- Phase 2a: live sources. Backend-served adapter configs cached here;
  -- novels/chapters gain source identity + a per-chapter live-fetch URL.
  -- Mock rows leave source_id / source_url NULL and keep working unchanged.
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    config_json TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );

  ALTER TABLE novels ADD COLUMN source_id TEXT;
  ALTER TABLE chapters ADD COLUMN source_url TEXT;
  `,
];
