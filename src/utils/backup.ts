import { sqlDb, getSettings } from "../db/sqlite";
import type {
  Work,
  Chapter,
  Series,
  Tag,
  SavePoint,
  BibliographyEntry,
  AppSettings,
  ReferenceFile,
} from "../types";

export interface BackupData {
  version: 1;
  exportedAt: string;
  works: Work[];
  chapters: Chapter[];
  bibliography: BibliographyEntry[];
  savePoints: SavePoint[];
  settings: AppSettings | null;
  tags: Tag[];
  series: Series[];
  referenceFiles: Array<Omit<ReferenceFile, "data"> & { data: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function deserializeWork(row: Row): Work {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    type: row.type,
    completionStatus: row.completionStatus,
    chapterMode: row.chapterMode,
    subjects: JSON.parse(row.subjects || "[]"),
    topics: JSON.parse(row.topics || "[]"),
    keyTerms: JSON.parse(row.keyTerms || "[]"),
    freeformTags: JSON.parse(row.freeformTags || "[]"),
    warnings: JSON.parse(row.warnings || "[]"),
    customTags: JSON.parse(row.customTags || "{}"),
    wordCount: row.wordCount,
    wordCountLimit: row.wordCountLimit ?? null,
    deadline: row.deadline ?? null,
    pinned: row.pinned === 1,
    seriesId: row.seriesId ?? null,
    seriesOrder: row.seriesOrder ?? null,
    citationStyle: row.citationStyle || "apa",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastOpenedAt: row.lastOpenedAt,
  };
}

function deserializeBibEntry(row: Row): BibliographyEntry {
  return {
    id: row.id,
    workId: row.workId,
    citeKey: row.citeKey,
    entryType: row.entryType,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journal: row.journal ?? undefined,
    volume: row.volume ?? undefined,
    pages: row.pages ?? undefined,
    publisher: row.publisher ?? undefined,
    url: row.url ?? undefined,
    doi: row.doi ?? undefined,
    abstract: row.abstract ?? undefined,
    notes: row.notes ?? undefined,
    raw: row.raw,
    createdAt: row.createdAt,
  };
}

export async function exportFullBackup(): Promise<BackupData> {
  const [workRows, chapterRows, bibRows, spRows, tagRows, seriesRows, refRows] =
    await Promise.all([
      sqlDb.sql`SELECT * FROM works`,
      sqlDb.sql`SELECT * FROM chapters`,
      sqlDb.sql`SELECT * FROM bibliography`,
      sqlDb.sql`SELECT * FROM savePoints`,
      sqlDb.sql`SELECT * FROM tags`,
      sqlDb.sql`SELECT * FROM series`,
      sqlDb.sql`SELECT * FROM referenceFiles`,
    ]);

  const works = (workRows as Row[]).map(deserializeWork);
  const chapters = chapterRows as Chapter[];
  const bibliography = (bibRows as Row[]).map(deserializeBibEntry);
  const savePoints = spRows as SavePoint[];
  const tags = tagRows as Tag[];
  const series = (seriesRows as Row[]).map((s) => ({
    ...s,
    workIds: JSON.parse(s.workIds || "[]"),
  })) as Series[];
  const settings = await getSettings();

  const referenceFiles = await Promise.all(
    (refRows as Row[]).map(async (rf) => {
      const blob =
        rf.data instanceof Blob
          ? rf.data
          : new Blob([rf.data], { type: rf.mimeType });
      const { ...rest } = rf;
      return {
        id: rest.id,
        workId: rest.workId,
        bibEntryId: rest.bibEntryId ?? null,
        filename: rest.filename,
        mimeType: rest.mimeType,
        addedAt: rest.addedAt,
        data: await blobToBase64(blob),
      };
    }),
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    works,
    chapters,
    bibliography,
    savePoints,
    settings,
    tags,
    series,
    referenceFiles,
  };
}

export async function exportWorkBackup(workId: number): Promise<BackupData> {
  const [workRows] = await Promise.all([
    sqlDb.sql`SELECT * FROM works WHERE id = ${workId}`,
  ]);
  if ((workRows as Row[]).length === 0) throw new Error("Work not found");

  const [chapterRows, bibRows, spRows, refRows] = await Promise.all([
    sqlDb.sql`SELECT * FROM chapters WHERE workId = ${workId}`,
    sqlDb.sql`SELECT * FROM bibliography WHERE workId = ${workId}`,
    sqlDb.sql`SELECT * FROM savePoints WHERE workId = ${workId}`,
    sqlDb.sql`SELECT * FROM referenceFiles WHERE workId = ${workId}`,
  ]);

  const works = (workRows as Row[]).map(deserializeWork);
  const chapters = chapterRows as Chapter[];
  const bibliography = (bibRows as Row[]).map(deserializeBibEntry);
  const savePoints = spRows as SavePoint[];

  const referenceFiles = await Promise.all(
    (refRows as Row[]).map(async (rf) => {
      const blob =
        rf.data instanceof Blob
          ? rf.data
          : new Blob([rf.data], { type: rf.mimeType });
      return {
        id: rf.id as number,
        workId: rf.workId as number,
        bibEntryId: (rf.bibEntryId as number | null) ?? null,
        filename: rf.filename as string,
        mimeType: rf.mimeType as string,
        addedAt: rf.addedAt as string,
        data: await blobToBase64(blob),
      };
    }),
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    works,
    chapters,
    bibliography,
    savePoints,
    settings: null,
    tags: [],
    series: [],
    referenceFiles,
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importBackup(
  data: BackupData,
  mode: "overwrite" | "skip",
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  await sqlDb.transaction(async (tx) => {
    // Works
    for (const work of data.works) {
      try {
        if (work.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM works WHERE id = ${work.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && work.id) {
          await tx.sql`DELETE FROM works WHERE id = ${work.id}`;
        }
        await tx.sql`INSERT INTO works (
          id, title, summary, status, type, completionStatus, chapterMode,
          subjects, topics, keyTerms, freeformTags, warnings, customTags,
          wordCount, wordCountLimit, deadline, pinned, seriesId, seriesOrder,
          citationStyle, createdAt, updatedAt, lastOpenedAt
        ) VALUES (
          ${work.id}, ${work.title}, ${work.summary}, ${work.status}, ${work.type},
          ${work.completionStatus}, ${work.chapterMode},
          ${JSON.stringify(work.subjects)}, ${JSON.stringify(work.topics)},
          ${JSON.stringify(work.keyTerms)}, ${JSON.stringify(work.freeformTags)},
          ${JSON.stringify(work.warnings)}, ${JSON.stringify(work.customTags)},
          ${work.wordCount}, ${work.wordCountLimit}, ${work.deadline},
          ${work.pinned ? 1 : 0}, ${work.seriesId}, ${work.seriesOrder},
          ${work.citationStyle}, ${work.createdAt}, ${work.updatedAt}, ${work.lastOpenedAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`Work "${work.title}": ${e}`);
      }
    }

    // Chapters
    for (const ch of data.chapters) {
      try {
        if (ch.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM chapters WHERE id = ${ch.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && ch.id) {
          await tx.sql`DELETE FROM chapters WHERE id = ${ch.id}`;
        }
        await tx.sql`INSERT INTO chapters (
          id, workId, title, "order", content, notes, summary, wordCount, createdAt, updatedAt
        ) VALUES (
          ${ch.id}, ${ch.workId}, ${ch.title}, ${ch.order}, ${ch.content},
          ${ch.notes}, ${ch.summary}, ${ch.wordCount}, ${ch.createdAt}, ${ch.updatedAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`Chapter: ${e}`);
      }
    }

    // Bibliography
    for (const entry of data.bibliography) {
      try {
        if (entry.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM bibliography WHERE id = ${entry.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && entry.id) {
          await tx.sql`DELETE FROM bibliography WHERE id = ${entry.id}`;
        }
        await tx.sql`INSERT INTO bibliography (
          id, workId, citeKey, entryType, title, authors, year,
          journal, volume, pages, publisher, url, doi, abstract, notes, raw, createdAt
        ) VALUES (
          ${entry.id}, ${entry.workId}, ${entry.citeKey}, ${entry.entryType},
          ${entry.title}, ${entry.authors}, ${entry.year},
          ${entry.journal ?? null}, ${entry.volume ?? null}, ${entry.pages ?? null},
          ${entry.publisher ?? null}, ${entry.url ?? null}, ${entry.doi ?? null},
          ${entry.abstract ?? null}, ${entry.notes ?? null}, ${entry.raw}, ${entry.createdAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`Bibliography: ${e}`);
      }
    }

    // Save points
    for (const sp of data.savePoints) {
      try {
        if (sp.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM savePoints WHERE id = ${sp.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && sp.id) {
          await tx.sql`DELETE FROM savePoints WHERE id = ${sp.id}`;
        }
        await tx.sql`INSERT INTO savePoints (
          id, workId, chapterId, name, content, createdAt
        ) VALUES (
          ${sp.id}, ${sp.workId}, ${sp.chapterId}, ${sp.name}, ${sp.content}, ${sp.createdAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`SavePoint: ${e}`);
      }
    }

    // Tags
    for (const tag of data.tags) {
      try {
        if (tag.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM tags WHERE id = ${tag.id}`;
          if (existing) { result.skipped++; continue; }
        }
        await tx.sql`INSERT OR REPLACE INTO tags (id, name, category) VALUES (${tag.id}, ${tag.name}, ${tag.category})`;
        result.imported++;
      } catch (e) {
        result.errors.push(`Tag: ${e}`);
      }
    }

    // Series
    for (const s of data.series) {
      try {
        if (s.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM series WHERE id = ${s.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && s.id) {
          await tx.sql`DELETE FROM series WHERE id = ${s.id}`;
        }
        await tx.sql`INSERT INTO series (
          id, title, description, workIds, createdAt, updatedAt
        ) VALUES (
          ${s.id}, ${s.title}, ${s.description},
          ${JSON.stringify(s.workIds)}, ${s.createdAt}, ${s.updatedAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`Series: ${e}`);
      }
    }

    // Reference files
    for (const rf of data.referenceFiles) {
      try {
        if (rf.id && mode === "skip") {
          const [existing] = await tx.sql`SELECT id FROM referenceFiles WHERE id = ${rf.id}`;
          if (existing) { result.skipped++; continue; }
        }
        if (mode === "overwrite" && rf.id) {
          await tx.sql`DELETE FROM referenceFiles WHERE id = ${rf.id}`;
        }
        const blob = base64ToBlob(rf.data);
        const uint8 = new Uint8Array(await blob.arrayBuffer());
        await tx.sql`INSERT INTO referenceFiles (
          id, workId, bibEntryId, filename, mimeType, data, addedAt
        ) VALUES (
          ${rf.id}, ${rf.workId}, ${rf.bibEntryId ?? null},
          ${rf.filename}, ${rf.mimeType}, ${uint8}, ${rf.addedAt}
        )`;
        result.imported++;
      } catch (e) {
        result.errors.push(`ReferenceFile: ${e}`);
      }
    }

    // Settings
    if (data.settings) {
      if (mode === "overwrite") {
        const s = data.settings;
        await tx.sql`INSERT OR REPLACE INTO settings (
          id, autoBackupEnabled, autoBackupIntervalDays, lastAutoBackupAt,
          backupPromptShown, toolbarCollapsed, defaultChapterMode, customTagCategories
        ) VALUES (
          1, ${s.autoBackupEnabled ? 1 : 0}, ${s.autoBackupIntervalDays},
          ${s.lastAutoBackupAt}, ${s.backupPromptShown ? 1 : 0},
          ${s.toolbarCollapsed ? 1 : 0}, ${s.defaultChapterMode},
          ${JSON.stringify(s.customTagCategories)}
        )`;
        result.imported++;
      } else {
        result.skipped++;
      }
    }
  });

  return result;
}

export function getBackupSummary(data: BackupData) {
  return {
    works: data.works.length,
    chapters: data.chapters.length,
    bibliography: data.bibliography.length,
    savePoints: data.savePoints.length,
    tags: data.tags.length,
    series: data.series.length,
    referenceFiles: data.referenceFiles.length,
    hasSettings: data.settings !== null,
  };
}
