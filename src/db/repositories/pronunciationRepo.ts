import { all, first, run } from "../client";
import type { NewPronunciationRule, PronunciationRule } from "@/data/types";

interface PronunciationRow {
  id: number;
  pattern: string;
  is_regex: number;
  replacement: string;
  language: string | null;
  case_sensitive: number;
  enabled: number;
  category: string | null;
  updated_at: number;
}

function rowToRule(r: PronunciationRow): PronunciationRule {
  return {
    id: r.id,
    pattern: r.pattern,
    isRegex: r.is_regex === 1,
    replacement: r.replacement,
    language: r.language,
    caseSensitive: r.case_sensitive === 1,
    enabled: r.enabled === 1,
    category: r.category,
    updatedAt: r.updated_at,
  };
}

function languageMatches(ruleLang: string | null, target: string): boolean {
  if (!ruleLang) return true;
  const a = ruleLang.toLowerCase();
  const b = target.toLowerCase();
  if (a === b) return true;
  // Match by language root (en-US matches en).
  return a.slice(0, 2) === b.slice(0, 2);
}

export const pronunciationRepo = {
  async listAll(): Promise<PronunciationRule[]> {
    const rows = await all<PronunciationRow>(
      `SELECT * FROM pronunciation_rules ORDER BY updated_at DESC`
    );
    return rows.map(rowToRule);
  },

  async listEnabledForLanguage(language: string): Promise<PronunciationRule[]> {
    const rows = await all<PronunciationRow>(
      `SELECT * FROM pronunciation_rules WHERE enabled = 1
       ORDER BY updated_at DESC`
    );
    return rows.map(rowToRule).filter((rule) => languageMatches(rule.language, language));
  },

  async search(query: string): Promise<PronunciationRule[]> {
    const needle = `%${query.trim()}%`;
    const rows = await all<PronunciationRow>(
      `SELECT * FROM pronunciation_rules
       WHERE pattern LIKE ? OR replacement LIKE ?
       ORDER BY updated_at DESC`,
      [needle, needle]
    );
    return rows.map(rowToRule);
  },

  async getById(id: number): Promise<PronunciationRule | null> {
    const row = await first<PronunciationRow>(
      `SELECT * FROM pronunciation_rules WHERE id = ?`,
      [id]
    );
    return row ? rowToRule(row) : null;
  },

  async upsert(rule: NewPronunciationRule): Promise<number> {
    const now = Date.now();
    if (rule.id) {
      await run(
        `UPDATE pronunciation_rules
         SET pattern = ?, is_regex = ?, replacement = ?, language = ?,
             case_sensitive = ?, enabled = ?, category = ?, updated_at = ?
         WHERE id = ?`,
        [
          rule.pattern,
          rule.isRegex ? 1 : 0,
          rule.replacement,
          rule.language ?? null,
          rule.caseSensitive ? 1 : 0,
          rule.enabled ? 1 : 0,
          rule.category ?? null,
          now,
          rule.id,
        ]
      );
      return rule.id;
    }
    const res = await run(
      `INSERT INTO pronunciation_rules
        (pattern, is_regex, replacement, language, case_sensitive, enabled, category, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.pattern,
        rule.isRegex ? 1 : 0,
        rule.replacement,
        rule.language ?? null,
        rule.caseSensitive ? 1 : 0,
        rule.enabled ? 1 : 0,
        rule.category ?? null,
        now,
      ]
    );
    return res.lastInsertRowId ?? 0;
  },

  async setEnabled(id: number, enabled: boolean): Promise<void> {
    await run(
      `UPDATE pronunciation_rules SET enabled = ?, updated_at = ? WHERE id = ?`,
      [enabled ? 1 : 0, Date.now(), id]
    );
  },

  async remove(id: number): Promise<void> {
    await run(`DELETE FROM pronunciation_rules WHERE id = ?`, [id]);
  },

  async categories(): Promise<string[]> {
    const rows = await all<{ category: string | null }>(
      `SELECT DISTINCT category FROM pronunciation_rules
       WHERE category IS NOT NULL AND category <> ''
       ORDER BY category ASC`
    );
    return rows.map((r) => r.category).filter((c): c is string => !!c);
  },

  async count(): Promise<number> {
    const r = await first<{ c: number }>(`SELECT COUNT(*) AS c FROM pronunciation_rules`);
    return r?.c ?? 0;
  },

  async countEnabled(): Promise<number> {
    const r = await first<{ c: number }>(
      `SELECT COUNT(*) AS c FROM pronunciation_rules WHERE enabled = 1`
    );
    return r?.c ?? 0;
  },
};
