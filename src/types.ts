// === Status / Metadata Enums ===

export type WorkStatus = "Draft" | "In Progress" | "Final" | "Archived";
export type WorkType = "Essay" | "Research Paper" | "Story" | "Notes" | "Other";
export type CompletionStatus = "Complete" | "Work in Progress";
export type ChapterMode = "single" | "chaptered";
export type CitationStyle = "apa" | "oscola";

export type DeadlineStatus = "none" | "upcoming" | "overdue" | "met";

// === Core Data Types ===

export interface Work {
  id?: number; // auto-incremented by Dexie
  title: string;
  summary: string;
  status: WorkStatus;
  type: WorkType;
  completionStatus: CompletionStatus;
  chapterMode: ChapterMode;

  // Tags (stored as arrays of strings per category)
  subjects: string[]; // Fandom → Subject
  topics: string[]; // Relationship → Topics/Themes
  keyTerms: string[]; // Character → Key Terms
  freeformTags: string[]; // Freeform
  warnings: string[]; // Warnings / content notes

  // Custom tag categories: { categoryName: [tags] }
  customTags: Record<string, string[]>;

  // Metadata
  wordCount: number;
  wordCountLimit: number | null; // null = no limit
  deadline: string | null; // ISO date string, null = no deadline
  pinned: boolean;
  seriesId: number | null;
  seriesOrder: number | null;

  // Citation
  citationStyle: CitationStyle;

  // Timestamps
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastOpenedAt: string; // ISO
}

export interface Chapter {
  id?: number;
  workId: number;
  title: string;
  order: number;
  content: string; // TipTap JSON stringified
  notes: string; // planning notes for this chapter
  summary: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id?: number;
  title: string;
  description: string;
  workIds: number[]; // ordered
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id?: number;
  name: string;
  category: string; // "subject" | "topic" | "keyTerm" | "freeform" | "warning" | user-defined
}

export interface SavePoint {
  id?: number;
  workId: number;
  chapterId: number | null; // null = whole work snapshot
  name: string | null; // null = autosave, string = manual save
  content: string; // snapshot of chapter content (TipTap JSON stringified)
  createdAt: string;
}

export interface BibliographyEntry {
  id?: number;
  workId: number; // which work owns this entry
  citeKey: string; // e.g. "smith2024"
  entryType: string; // "article" | "book" | "inproceedings" etc.
  title: string;
  authors: string;
  year: string;
  journal?: string;
  volume?: string;
  pages?: string;
  publisher?: string;
  url?: string;
  doi?: string;
  abstract?: string;
  notes?: string;
  raw: string; // original BibTeX string
  createdAt: string;
}

export interface AppSettings {
  id?: number; // always 1, singleton
  autoBackupEnabled: boolean;
  autoBackupIntervalDays: number;
  lastAutoBackupAt: string | null;
  backupPromptShown: boolean;
  toolbarCollapsed: boolean;
  defaultChapterMode: ChapterMode;
  customTagCategories: string[]; // user-defined category names
}

export interface ReferenceFile {
  id?: number;
  workId: number;
  bibEntryId: number | null; // linked bibliography entry, null = unlinked
  filename: string;
  mimeType: string;
  data: Blob;
  addedAt: string; // ISO
}

// === Derived / Computed Types ===

export function getDeadlineStatus(work: Work): DeadlineStatus {
  if (!work.deadline) return "none";
  const now = new Date();
  const deadline = new Date(work.deadline);
  if (work.completionStatus === "Complete") return "met";
  const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "upcoming";
  return "none";
}

export function isOverWordLimit(work: Work): boolean {
  if (work.wordCountLimit === null) return false;
  return work.wordCount > work.wordCountLimit;
}
