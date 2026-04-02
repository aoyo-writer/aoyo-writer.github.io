/**
 * One-time migration from Dexie (IndexedDB) to SQLite (OPFS).
 * Runs automatically on first load if Dexie has data and SQLite is empty.
 * After migration, Dexie data is left untouched as a backup.
 */
import { sqlDb } from "./sqlite";

export async function migrateFromDexie(): Promise<void> {
  // Check if SQLite already has data
  const [countRow] = await sqlDb.sql<{ cnt: number }>`SELECT COUNT(*) as cnt FROM works`;
  if (countRow.cnt > 0) return; // Already migrated or has data

  // Check if Dexie/IndexedDB database exists
  let dbNames: string[] = [];
  if (indexedDB.databases) {
    const databases = await indexedDB.databases();
    dbNames = databases.map((d) => d.name ?? "");
  }
  if (!dbNames.includes("aoyo")) return; // No Dexie data to migrate

  // Dynamically import Dexie to read old data
  const Dexie = (await import("dexie")).default;
  const oldDb = new Dexie("aoyo");

  // Define the schema as it was in v4
  oldDb.version(4).stores({
    works:
      "++id, title, status, type, completionStatus, pinned, seriesId, createdAt, updatedAt, lastOpenedAt, *subjects, *topics, *keyTerms, *freeformTags, *warnings",
    chapters: "++id, workId, order, updatedAt",
    series: "++id, title, createdAt",
    tags: "++id, name, category, [name+category]",
    savePoints: "++id, workId, chapterId, createdAt",
    bibliography: "++id, workId, citeKey, title, authors, year",
    settings: "++id",
    referenceFiles: "++id, workId, bibEntryId, filename, addedAt",
  });

  try {
    await oldDb.open();

    // Read all data from Dexie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const works: any[] = await oldDb.table("works").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapters: any[] = await oldDb.table("chapters").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series: any[] = await oldDb.table("series").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags: any[] = await oldDb.table("tags").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savePoints: any[] = await oldDb.table("savePoints").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bibliography: any[] = await oldDb.table("bibliography").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsRows: any[] = await oldDb.table("settings").toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const referenceFiles: any[] = await oldDb.table("referenceFiles").toArray();

    if (works.length === 0 && chapters.length === 0) {
      oldDb.close();
      return; // Nothing to migrate
    }

    console.log(
      `[Migration] Migrating from Dexie: ${works.length} works, ${chapters.length} chapters, ${bibliography.length} bib entries, ${referenceFiles.length} ref files`,
    );

    // Insert into SQLite using a transaction
    await sqlDb.transaction(async (tx) => {
      // Works
      for (const w of works) {
        await tx.sql`INSERT INTO works (
          id, title, summary, status, type, completionStatus, chapterMode,
          subjects, topics, keyTerms, freeformTags, warnings, customTags,
          wordCount, wordCountLimit, deadline, pinned, seriesId, seriesOrder,
          citationStyle, createdAt, updatedAt, lastOpenedAt
        ) VALUES (
          ${w.id}, ${w.title || ""}, ${w.summary || ""},
          ${w.status || "Draft"}, ${w.type || "Essay"},
          ${w.completionStatus || "Work in Progress"},
          ${w.chapterMode || "single"},
          ${JSON.stringify(w.subjects || [])},
          ${JSON.stringify(w.topics || [])},
          ${JSON.stringify(w.keyTerms || [])},
          ${JSON.stringify(w.freeformTags || [])},
          ${JSON.stringify(w.warnings || [])},
          ${JSON.stringify(w.customTags || {})},
          ${w.wordCount || 0}, ${w.wordCountLimit ?? null},
          ${w.deadline ?? null}, ${w.pinned ? 1 : 0},
          ${w.seriesId ?? null}, ${w.seriesOrder ?? null},
          ${w.citationStyle || "apa"},
          ${w.createdAt || new Date().toISOString()},
          ${w.updatedAt || new Date().toISOString()},
          ${w.lastOpenedAt || new Date().toISOString()}
        )`;
      }

      // Chapters
      for (const ch of chapters) {
        await tx.sql`INSERT INTO chapters (
          id, workId, title, "order", content, notes, summary,
          wordCount, createdAt, updatedAt
        ) VALUES (
          ${ch.id}, ${ch.workId}, ${ch.title || ""},
          ${ch.order || 1}, ${ch.content || "{}"},
          ${ch.notes || ""}, ${ch.summary || ""},
          ${ch.wordCount || 0},
          ${ch.createdAt || new Date().toISOString()},
          ${ch.updatedAt || new Date().toISOString()}
        )`;
      }

      // Series
      for (const s of series) {
        await tx.sql`INSERT INTO series (
          id, title, description, workIds, createdAt, updatedAt
        ) VALUES (
          ${s.id}, ${s.title || ""}, ${s.description || ""},
          ${JSON.stringify(s.workIds || [])},
          ${s.createdAt || new Date().toISOString()},
          ${s.updatedAt || new Date().toISOString()}
        )`;
      }

      // Tags
      for (const t of tags) {
        await tx.sql`INSERT OR IGNORE INTO tags (
          id, name, category
        ) VALUES (${t.id}, ${t.name}, ${t.category})`;
      }

      // Save Points
      for (const sp of savePoints) {
        await tx.sql`INSERT INTO savePoints (
          id, workId, chapterId, name, content, createdAt
        ) VALUES (
          ${sp.id}, ${sp.workId}, ${sp.chapterId ?? null},
          ${sp.name ?? null}, ${sp.content || ""},
          ${sp.createdAt || new Date().toISOString()}
        )`;
      }

      // Bibliography
      for (const b of bibliography) {
        await tx.sql`INSERT INTO bibliography (
          id, workId, citeKey, entryType, title, authors, year,
          journal, volume, pages, publisher, url, doi, abstract, raw,
          createdAt
        ) VALUES (
          ${b.id}, ${b.workId}, ${b.citeKey || ""}, ${b.entryType || "article"},
          ${b.title || ""}, ${b.authors || ""}, ${b.year || ""},
          ${b.journal ?? null}, ${b.volume ?? null}, ${b.pages ?? null},
          ${b.publisher ?? null}, ${b.url ?? null}, ${b.doi ?? null},
          ${b.abstract ?? null}, ${b.raw || ""},
          ${b.createdAt || new Date().toISOString()}
        )`;
      }

      // Reference Files (Blob → Uint8Array)
      for (const rf of referenceFiles) {
        let data: Uint8Array;
        if (rf.data instanceof Blob) {
          data = new Uint8Array(await rf.data.arrayBuffer());
        } else if (rf.data instanceof ArrayBuffer) {
          data = new Uint8Array(rf.data);
        } else {
          data = new Uint8Array(0);
        }
        await tx.sql`INSERT INTO referenceFiles (
          id, workId, bibEntryId, filename, mimeType, data, addedAt
        ) VALUES (
          ${rf.id}, ${rf.workId}, ${rf.bibEntryId ?? null},
          ${rf.filename || ""}, ${rf.mimeType || "application/pdf"},
          ${data}, ${rf.addedAt || new Date().toISOString()}
        )`;
      }

      // Settings
      if (settingsRows.length > 0) {
        const s = settingsRows[0];
        await tx.sql`INSERT OR REPLACE INTO settings (
          id, autoBackupEnabled, autoBackupIntervalDays, lastAutoBackupAt,
          backupPromptShown, toolbarCollapsed, defaultChapterMode, customTagCategories
        ) VALUES (
          1, ${s.autoBackupEnabled ? 1 : 0}, ${s.autoBackupIntervalDays || 7},
          ${s.lastAutoBackupAt ?? null}, ${s.backupPromptShown ? 1 : 0},
          ${s.toolbarCollapsed ? 1 : 0}, ${s.defaultChapterMode || "single"},
          ${JSON.stringify(s.customTagCategories || [])}
        )`;
      }
    });

    console.log("[Migration] Migration complete!");
    oldDb.close();
  } catch (err) {
    console.error("[Migration] Migration failed:", err);
    throw err;
  }
}
