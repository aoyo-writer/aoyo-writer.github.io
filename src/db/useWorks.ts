import { sqlDb, useSqlQuery } from "./sqlite";
import type {
  Work,
  Chapter,
  BibliographyEntry,
  ReferenceFile,
  WorkStatus,
  CompletionStatus,
} from "../types";

// === Row Types (what SQLite returns) ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// === Deserialization Helpers ===

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

function deserializeChapter(row: Row): Chapter {
  return {
    id: row.id,
    workId: row.workId,
    title: row.title,
    order: row.order,
    content: row.content,
    notes: row.notes,
    summary: row.summary,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

function deserializeRefFile(row: Row): ReferenceFile {
  return {
    id: row.id,
    workId: row.workId,
    bibEntryId: row.bibEntryId ?? null,
    filename: row.filename,
    mimeType: row.mimeType,
    data:
      row.data instanceof Blob
        ? row.data
        : new Blob([row.data], { type: row.mimeType }),
    addedAt: row.addedAt,
  };
}

// === Work CRUD ===

export function useAllWorks(): Work[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM works ORDER BY updatedAt DESC`,
    [],
  );
  return rows?.map(deserializeWork);
}

export function useWork(id: number | undefined): Work | undefined {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM works WHERE id = ${id ?? -1}`,
    [id],
  );
  if (!rows) return undefined;
  return rows[0] ? deserializeWork(rows[0]) : undefined;
}

export function useRecentWorks(limit = 5): Work[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) =>
      sql`SELECT * FROM works ORDER BY lastOpenedAt DESC LIMIT ${limit}`,
    [limit],
  );
  return rows?.map(deserializeWork);
}

export function usePinnedWorks(): Work[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM works WHERE pinned = 1`,
    [],
  );
  return rows?.map(deserializeWork);
}

export function useWorksByStatus(status: WorkStatus): Work[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM works WHERE status = ${status}`,
    [status],
  );
  return rows?.map(deserializeWork);
}

export async function createWork(
  work: Omit<
    Work,
    "id" | "createdAt" | "updatedAt" | "lastOpenedAt" | "wordCount"
  >,
): Promise<number> {
  const now = new Date().toISOString();
  const [result] = await sqlDb.sql<{ id: number }>`INSERT INTO works (
    title, summary, status, type, completionStatus, chapterMode,
    subjects, topics, keyTerms, freeformTags, warnings, customTags,
    wordCount, wordCountLimit, deadline, pinned, seriesId, seriesOrder,
    citationStyle, createdAt, updatedAt, lastOpenedAt
  ) VALUES (
    ${work.title}, ${work.summary}, ${work.status}, ${work.type},
    ${work.completionStatus}, ${work.chapterMode},
    ${JSON.stringify(work.subjects)}, ${JSON.stringify(work.topics)},
    ${JSON.stringify(work.keyTerms)}, ${JSON.stringify(work.freeformTags)},
    ${JSON.stringify(work.warnings)}, ${JSON.stringify(work.customTags)},
    0, ${work.wordCountLimit}, ${work.deadline},
    ${work.pinned ? 1 : 0}, ${work.seriesId}, ${work.seriesOrder},
    ${work.citationStyle}, ${now}, ${now}, ${now}
  ) RETURNING id`;

  const workId = result.id;

  // Create initial chapter
  await sqlDb.sql`INSERT INTO chapters (
    workId, title, "order", content, notes, summary, wordCount, createdAt, updatedAt
  ) VALUES (
    ${workId}, ${work.chapterMode === "single" ? "" : "Chapter 1"},
    1, ${JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] })},
    '', '', 0, ${now}, ${now}
  )`;

  return workId;
}

export async function updateWork(
  id: number,
  changes: Partial<Work>,
): Promise<void> {
  const now = new Date().toISOString();

  // Build SET clause dynamically
  const sets: string[] = ["updatedAt = ?"];
  const params: unknown[] = [now];

  if (changes.title !== undefined) {
    sets.push("title = ?");
    params.push(changes.title);
  }
  if (changes.summary !== undefined) {
    sets.push("summary = ?");
    params.push(changes.summary);
  }
  if (changes.status !== undefined) {
    sets.push("status = ?");
    params.push(changes.status);
  }
  if (changes.type !== undefined) {
    sets.push("type = ?");
    params.push(changes.type);
  }
  if (changes.completionStatus !== undefined) {
    sets.push("completionStatus = ?");
    params.push(changes.completionStatus);
  }
  if (changes.chapterMode !== undefined) {
    sets.push("chapterMode = ?");
    params.push(changes.chapterMode);
  }
  if (changes.subjects !== undefined) {
    sets.push("subjects = ?");
    params.push(JSON.stringify(changes.subjects));
  }
  if (changes.topics !== undefined) {
    sets.push("topics = ?");
    params.push(JSON.stringify(changes.topics));
  }
  if (changes.keyTerms !== undefined) {
    sets.push("keyTerms = ?");
    params.push(JSON.stringify(changes.keyTerms));
  }
  if (changes.freeformTags !== undefined) {
    sets.push("freeformTags = ?");
    params.push(JSON.stringify(changes.freeformTags));
  }
  if (changes.warnings !== undefined) {
    sets.push("warnings = ?");
    params.push(JSON.stringify(changes.warnings));
  }
  if (changes.customTags !== undefined) {
    sets.push("customTags = ?");
    params.push(JSON.stringify(changes.customTags));
  }
  if (changes.wordCount !== undefined) {
    sets.push("wordCount = ?");
    params.push(changes.wordCount);
  }
  if (changes.wordCountLimit !== undefined) {
    sets.push("wordCountLimit = ?");
    params.push(changes.wordCountLimit);
  }
  if (changes.deadline !== undefined) {
    sets.push("deadline = ?");
    params.push(changes.deadline);
  }
  if (changes.pinned !== undefined) {
    sets.push("pinned = ?");
    params.push(changes.pinned ? 1 : 0);
  }
  if (changes.seriesId !== undefined) {
    sets.push("seriesId = ?");
    params.push(changes.seriesId);
  }
  if (changes.seriesOrder !== undefined) {
    sets.push("seriesOrder = ?");
    params.push(changes.seriesOrder);
  }
  if (changes.citationStyle !== undefined) {
    sets.push("citationStyle = ?");
    params.push(changes.citationStyle);
  }
  if (changes.lastOpenedAt !== undefined) {
    sets.push("lastOpenedAt = ?");
    params.push(changes.lastOpenedAt);
  }

  params.push(id);
  await sqlDb.exec(
    `UPDATE works SET ${sets.join(", ")} WHERE id = ?`,
    params,
  );
}

export async function deleteWork(id: number): Promise<void> {
  // CASCADE handles chapters, savePoints, bibliography, referenceFiles
  await sqlDb.sql`DELETE FROM works WHERE id = ${id}`;
}

export async function touchWork(id: number): Promise<void> {
  const now = new Date().toISOString();
  await sqlDb.sql`UPDATE works SET lastOpenedAt = ${now} WHERE id = ${id}`;
}

// === Chapter CRUD ===

export function useChapters(workId: number | undefined): Chapter[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) =>
      sql`SELECT * FROM chapters WHERE workId = ${workId ?? -1} ORDER BY "order"`,
    [workId],
  );
  return rows?.map(deserializeChapter);
}

export function useChapter(id: number | undefined): Chapter | undefined {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM chapters WHERE id = ${id ?? -1}`,
    [id],
  );
  if (!rows) return undefined;
  return rows[0] ? deserializeChapter(rows[0]) : undefined;
}

/** Non-reactive query for use in imports/exports */
export async function getChaptersByWorkId(
  workId: number,
): Promise<Chapter[]> {
  const rows = await sqlDb.sql`SELECT * FROM chapters WHERE workId = ${workId} ORDER BY "order"`;
  return rows.map(deserializeChapter);
}

export async function createChapter(
  workId: number,
  title: string,
  order: number,
): Promise<number> {
  const now = new Date().toISOString();
  const [result] = await sqlDb.sql<{ id: number }>`INSERT INTO chapters (
    workId, title, "order", content, notes, summary, wordCount, createdAt, updatedAt
  ) VALUES (
    ${workId}, ${title}, ${order},
    ${JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] })},
    '', '', 0, ${now}, ${now}
  ) RETURNING id`;
  await updateWork(workId, {});
  return result.id;
}

export async function updateChapter(
  id: number,
  changes: Partial<Chapter>,
): Promise<void> {
  const now = new Date().toISOString();
  const sets: string[] = ["updatedAt = ?"];
  const params: unknown[] = [now];

  if (changes.title !== undefined) {
    sets.push("title = ?");
    params.push(changes.title);
  }
  if (changes.order !== undefined) {
    sets.push('"order" = ?');
    params.push(changes.order);
  }
  if (changes.content !== undefined) {
    sets.push("content = ?");
    params.push(changes.content);
  }
  if (changes.notes !== undefined) {
    sets.push("notes = ?");
    params.push(changes.notes);
  }
  if (changes.summary !== undefined) {
    sets.push("summary = ?");
    params.push(changes.summary);
  }
  if (changes.wordCount !== undefined) {
    sets.push("wordCount = ?");
    params.push(changes.wordCount);
  }

  params.push(id);
  await sqlDb.exec(
    `UPDATE chapters SET ${sets.join(", ")} WHERE id = ?`,
    params,
  );
}

export async function deleteChapter(id: number): Promise<void> {
  const [chapter] = await sqlDb.sql<Row>`SELECT workId, "order" FROM chapters WHERE id = ${id}`;
  if (!chapter) return;

  await sqlDb.sql`DELETE FROM chapters WHERE id = ${id}`;

  // Reorder remaining chapters
  const remaining = await sqlDb.sql<Row>`SELECT id FROM chapters WHERE workId = ${chapter.workId} ORDER BY "order"`;
  for (let i = 0; i < remaining.length; i++) {
    await sqlDb.sql`UPDATE chapters SET "order" = ${i + 1} WHERE id = ${remaining[i].id}`;
  }
}

// === Recalculate work word count from chapters ===

export async function recalcWorkWordCount(workId: number): Promise<void> {
  const [result] = await sqlDb.sql<{ total: number }>`SELECT COALESCE(SUM(wordCount), 0) as total FROM chapters WHERE workId = ${workId}`;
  const now = new Date().toISOString();
  await sqlDb.sql`UPDATE works SET wordCount = ${result.total}, updatedAt = ${now} WHERE id = ${workId}`;
}

// === Save Points ===

const MAX_SAVE_POINTS_PER_CHAPTER = 50;

export async function createSavePoint(
  workId: number,
  chapterId: number,
  content: string,
  name: string | null = null,
): Promise<number> {
  const now = new Date().toISOString();
  const [result] = await sqlDb.sql<{ id: number }>`INSERT INTO savePoints (
    workId, chapterId, name, content, createdAt
  ) VALUES (
    ${workId}, ${chapterId}, ${name}, ${content}, ${now}
  ) RETURNING id`;

  // Prune old save points: keep latest N per chapter
  await sqlDb.sql`DELETE FROM savePoints WHERE id IN (
    SELECT id FROM savePoints
    WHERE workId = ${workId} AND chapterId = ${chapterId}
    ORDER BY createdAt DESC
    LIMIT -1 OFFSET ${MAX_SAVE_POINTS_PER_CHAPTER}
  )`;

  return result.id;
}

export function useSavePoints(
  workId: number | undefined,
): import("../types").SavePoint[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) =>
      sql`SELECT * FROM savePoints WHERE workId = ${workId ?? -1} ORDER BY createdAt DESC`,
    [workId],
  );
  return rows?.map((r) => ({
    id: r.id,
    workId: r.workId,
    chapterId: r.chapterId ?? null,
    name: r.name ?? null,
    content: r.content,
    createdAt: r.createdAt,
  }));
}

export async function deleteSavePoint(id: number): Promise<void> {
  await sqlDb.sql`DELETE FROM savePoints WHERE id = ${id}`;
}

// === Bibliography CRUD ===

export function useBibliography(
  workId: number | undefined,
): BibliographyEntry[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) =>
      sql`SELECT * FROM bibliography WHERE workId = ${workId ?? -1}`,
    [workId],
  );
  return rows?.map(deserializeBibEntry);
}

export async function addBibEntry(
  entry: Omit<BibliographyEntry, "id" | "createdAt">,
): Promise<number> {
  const now = new Date().toISOString();
  const [result] = await sqlDb.sql<{ id: number }>`INSERT INTO bibliography (
    workId, citeKey, entryType, title, authors, year,
    journal, volume, pages, publisher, url, doi, abstract, raw, createdAt
  ) VALUES (
    ${entry.workId}, ${entry.citeKey}, ${entry.entryType},
    ${entry.title}, ${entry.authors}, ${entry.year},
    ${entry.journal ?? null}, ${entry.volume ?? null},
    ${entry.pages ?? null}, ${entry.publisher ?? null},
    ${entry.url ?? null}, ${entry.doi ?? null},
    ${entry.abstract ?? null}, ${entry.raw || ""},
    ${now}
  ) RETURNING id`;
  return result.id;
}

export async function deleteBibEntry(id: number): Promise<void> {
  await sqlDb.sql`DELETE FROM bibliography WHERE id = ${id}`;
}

export async function updateBibEntry(
  id: number,
  changes: Partial<BibliographyEntry>,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (changes.citeKey !== undefined) {
    sets.push("citeKey = ?");
    params.push(changes.citeKey);
  }
  if (changes.title !== undefined) {
    sets.push("title = ?");
    params.push(changes.title);
  }
  if (changes.authors !== undefined) {
    sets.push("authors = ?");
    params.push(changes.authors);
  }
  if (changes.year !== undefined) {
    sets.push("year = ?");
    params.push(changes.year);
  }
  if (changes.doi !== undefined) {
    sets.push("doi = ?");
    params.push(changes.doi);
  }
  if (changes.abstract !== undefined) {
    sets.push("abstract = ?");
    params.push(changes.abstract);
  }
  if (changes.notes !== undefined) {
    sets.push("notes = ?");
    params.push(changes.notes);
  }

  if (sets.length === 0) return;
  params.push(id);
  await sqlDb.exec(
    `UPDATE bibliography SET ${sets.join(", ")} WHERE id = ?`,
    params,
  );
}

// === Reference Files ===

export function useReferenceFiles(
  workId: number | undefined,
): ReferenceFile[] | undefined {
  const rows = useSqlQuery<Row>(
    (sql) =>
      sql`SELECT * FROM referenceFiles WHERE workId = ${workId ?? -1}`,
    [workId],
  );
  return rows?.map(deserializeRefFile);
}

export async function addReferenceFile(
  file: Omit<ReferenceFile, "id" | "addedAt">,
): Promise<number> {
  const now = new Date().toISOString();
  let data: Uint8Array;
  if (file.data instanceof Blob) {
    data = new Uint8Array(await file.data.arrayBuffer());
  } else {
    data = file.data as unknown as Uint8Array;
  }

  const [result] = await sqlDb.sql<{ id: number }>`INSERT INTO referenceFiles (
    workId, bibEntryId, filename, mimeType, data, addedAt
  ) VALUES (
    ${file.workId}, ${file.bibEntryId ?? null},
    ${file.filename}, ${file.mimeType},
    ${data}, ${now}
  ) RETURNING id`;
  return result.id;
}

export async function deleteReferenceFile(id: number): Promise<void> {
  await sqlDb.sql`DELETE FROM referenceFiles WHERE id = ${id}`;
}

export async function updateReferenceFile(
  id: number,
  changes: Partial<ReferenceFile>,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (changes.bibEntryId !== undefined) {
    sets.push("bibEntryId = ?");
    params.push(changes.bibEntryId);
  }
  if (changes.filename !== undefined) {
    sets.push("filename = ?");
    params.push(changes.filename);
  }

  if (sets.length === 0) return;
  params.push(id);
  await sqlDb.exec(
    `UPDATE referenceFiles SET ${sets.join(", ")} WHERE id = ?`,
    params,
  );
}

// === Stats ===

export function useWorkStats() {
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT status, completionStatus, wordCount FROM works`,
    [],
  );

  if (!rows) return undefined;

  return {
    totalWorks: rows.length,
    totalWords: rows.reduce((sum, w) => sum + (w.wordCount || 0), 0),
    byStatus: {
      Draft: rows.filter((w) => w.status === "Draft").length,
      "In Progress": rows.filter((w) => w.status === "In Progress").length,
      Final: rows.filter((w) => w.status === "Final").length,
      Archived: rows.filter((w) => w.status === "Archived").length,
    } as Record<WorkStatus, number>,
    byCompletion: {
      Complete: rows.filter((w) => w.completionStatus === "Complete").length,
      "Work in Progress": rows.filter(
        (w) => w.completionStatus === "Work in Progress",
      ).length,
    } as Record<CompletionStatus, number>,
  };
}
