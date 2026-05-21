import * as SQLite from "expo-sqlite";
import { MIGRATIONS, SCHEMA_VERSION } from "./schema";

const DB_NAME = "webreader.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error("DB not initialized. Call initDb() before getDb().");
  }
  return dbInstance;
}

export function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
    dbInstance = db;
    return db;
  })();
  return initPromise;
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM schema_meta WHERE key = 'version'`
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;
  for (let v = currentVersion; v < SCHEMA_VERSION; v++) {
    const sql = MIGRATIONS[v];
    if (!sql) continue;
    await db.execAsync(sql);
  }
  await db.runAsync(
    `INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', ?)`,
    String(SCHEMA_VERSION)
  );
}

export async function run(sql: string, params: SQLite.SQLiteBindValue[] = []) {
  return getDb().runAsync(sql, params);
}

export async function all<T = unknown>(sql: string, params: SQLite.SQLiteBindValue[] = []) {
  return getDb().getAllAsync<T>(sql, params);
}

export async function first<T = unknown>(sql: string, params: SQLite.SQLiteBindValue[] = []) {
  return getDb().getFirstAsync<T>(sql, params);
}

export async function exec(sql: string) {
  return getDb().execAsync(sql);
}

export async function resetDb() {
  const db = getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS schema_meta;
    DROP TABLE IF EXISTS novels;
    DROP TABLE IF EXISTS chapters;
    DROP TABLE IF EXISTS progress;
    DROP TABLE IF EXISTS download_queue;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS kv_settings;
  `);
  dbInstance = null;
  initPromise = null;
  await initDb();
}
