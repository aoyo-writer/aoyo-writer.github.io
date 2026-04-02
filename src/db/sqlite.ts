import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { SQLocal } from "sqlocal";
import type { StatementInput } from "sqlocal";
import type { AppSettings, ChapterMode } from "../types";

// === Database Instance ===

export const sqlDb = new SQLocal({
  databasePath: "aoyo.sqlite3",
  reactive: true,
  onInit: (sql) => [
    sql`PRAGMA foreign_keys = ON`,
    sql`PRAGMA journal_mode = WAL`,

    // Works
    sql`CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Draft',
      type TEXT NOT NULL DEFAULT 'Essay',
      completionStatus TEXT NOT NULL DEFAULT 'Work in Progress',
      chapterMode TEXT NOT NULL DEFAULT 'single',
      subjects TEXT NOT NULL DEFAULT '[]',
      topics TEXT NOT NULL DEFAULT '[]',
      keyTerms TEXT NOT NULL DEFAULT '[]',
      freeformTags TEXT NOT NULL DEFAULT '[]',
      warnings TEXT NOT NULL DEFAULT '[]',
      customTags TEXT NOT NULL DEFAULT '{}',
      wordCount INTEGER NOT NULL DEFAULT 0,
      wordCountLimit INTEGER,
      deadline TEXT,
      pinned INTEGER NOT NULL DEFAULT 0,
      seriesId INTEGER,
      seriesOrder INTEGER,
      citationStyle TEXT NOT NULL DEFAULT 'apa',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastOpenedAt TEXT NOT NULL
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_works_updatedAt ON works(updatedAt)`,
    sql`CREATE INDEX IF NOT EXISTS idx_works_lastOpenedAt ON works(lastOpenedAt)`,
    sql`CREATE INDEX IF NOT EXISTS idx_works_pinned ON works(pinned)`,
    sql`CREATE INDEX IF NOT EXISTS idx_works_status ON works(status)`,

    // Chapters
    sql`CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workId INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      "order" INTEGER NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      notes TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      wordCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workId) REFERENCES works(id) ON DELETE CASCADE
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_chapters_workId ON chapters(workId)`,

    // Series
    sql`CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      workIds TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,

    // Tags
    sql`CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      UNIQUE(name, category)
    )`,

    // Save Points
    sql`CREATE TABLE IF NOT EXISTS savePoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workId INTEGER NOT NULL,
      chapterId INTEGER,
      name TEXT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (workId) REFERENCES works(id) ON DELETE CASCADE
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_savePoints_workId ON savePoints(workId)`,

    // Bibliography
    sql`CREATE TABLE IF NOT EXISTS bibliography (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workId INTEGER NOT NULL,
      citeKey TEXT NOT NULL,
      entryType TEXT NOT NULL DEFAULT 'article',
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      year TEXT NOT NULL,
      journal TEXT,
      volume TEXT,
      pages TEXT,
      publisher TEXT,
      url TEXT,
      doi TEXT,
      abstract TEXT,
      raw TEXT NOT NULL DEFAULT '',
      notes TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (workId) REFERENCES works(id) ON DELETE CASCADE
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_bibliography_workId ON bibliography(workId)`,

    // Reference Files
    sql`CREATE TABLE IF NOT EXISTS referenceFiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workId INTEGER NOT NULL,
      bibEntryId INTEGER,
      filename TEXT NOT NULL,
      mimeType TEXT NOT NULL DEFAULT 'application/pdf',
      data BLOB NOT NULL,
      addedAt TEXT NOT NULL,
      FOREIGN KEY (workId) REFERENCES works(id) ON DELETE CASCADE
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_referenceFiles_workId ON referenceFiles(workId)`,

    // Settings (singleton)
    sql`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      autoBackupEnabled INTEGER NOT NULL DEFAULT 0,
      autoBackupIntervalDays INTEGER NOT NULL DEFAULT 7,
      lastAutoBackupAt TEXT,
      backupPromptShown INTEGER NOT NULL DEFAULT 0,
      toolbarCollapsed INTEGER NOT NULL DEFAULT 0,
      defaultChapterMode TEXT NOT NULL DEFAULT 'single',
      customTagCategories TEXT NOT NULL DEFAULT '[]'
    )`,

    // Schema version tracking
    sql`CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ],
});

// === Initialize Settings ===

export async function initSettings(): Promise<void> {
  const [existing] = await sqlDb.sql`SELECT id FROM settings WHERE id = 1`;
  if (!existing) {
    await sqlDb.sql`INSERT INTO settings (id) VALUES (1)`;
  }

  // Schema migrations — add columns that may not exist in older databases
  try {
    await sqlDb.sql`ALTER TABLE bibliography ADD COLUMN notes TEXT`;
  } catch {
    // Column already exists — expected for new databases
  }

  await sqlDb.sql`INSERT OR REPLACE INTO _meta (key, value) VALUES ('schemaVersion', '2')`;
}

export async function getSettings(): Promise<AppSettings> {
  const [row] = await sqlDb.sql`SELECT * FROM settings WHERE id = 1`;
  if (!row) {
    await sqlDb.sql`INSERT INTO settings (id) VALUES (1)`;
    const [fresh] = await sqlDb.sql`SELECT * FROM settings WHERE id = 1`;
    return deserializeSettings(fresh);
  }
  return deserializeSettings(row);
}

// === Serialization Helpers ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeSettings(row: Record<string, any>): AppSettings {
  return {
    id: row.id as number,
    autoBackupEnabled: row.autoBackupEnabled === 1,
    autoBackupIntervalDays: row.autoBackupIntervalDays as number,
    lastAutoBackupAt: row.lastAutoBackupAt as string | null,
    backupPromptShown: row.backupPromptShown === 1,
    toolbarCollapsed: row.toolbarCollapsed === 1,
    defaultChapterMode: (row.defaultChapterMode as ChapterMode) || "single",
    customTagCategories: JSON.parse(row.customTagCategories || "[]"),
  };
}

// === Custom Reactive Hook ===

/**
 * Reactive SQL query hook that re-runs when deps change.
 * Returns undefined while loading (matching useLiveQuery behavior),
 * then returns the query results array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSqlQuery<T extends Record<string, any>>(
  query: StatementInput<T>,
  deps: unknown[],
): T[] | undefined {
  const [pending, setPending] = useState(true);

  const rq = useMemo(() => {
    setPending(true);
    return sqlDb.reactiveQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const get = useCallback(() => rq.value, [rq]);
  const subscribe = useCallback(
    (cb: () => void) => {
      const sub = rq.subscribe(() => {
        cb();
        setPending(false);
      });
      return sub.unsubscribe;
    },
    [rq],
  );

  const data = useSyncExternalStore(subscribe, get);
  return pending ? undefined : data;
}
