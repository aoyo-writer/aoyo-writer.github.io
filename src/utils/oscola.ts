import type { BibliographyEntry } from "../types";

/**
 * OSCOLA (Oxford Standard for Citation of Legal Authorities) formatting.
 * Adapted for general academic use — books, articles, chapters.
 *
 * Key differences from APA:
 * - Author names: First Surname (not inverted)
 * - Footnotes instead of inline citations
 * - Bibliography organized by type
 */

/** Format a full first-citation footnote (OSCOLA style). */
export function formatOSCOLAFootnote(entry: BibliographyEntry): string {
  const authors = formatAuthorsOSCOLA(entry.authors);

  switch (entry.entryType) {
    case "article":
      // Author, 'Title' [Year] Volume Journal Pages
      return buildArticle(authors, entry);
    case "book":
      // Author, Title (Publisher Year)
      return buildBook(authors, entry);
    case "inbook":
    case "incollection":
      // Author, 'Chapter Title' in Editor, Book Title (Publisher Year)
      return buildChapter(authors, entry);
    case "inproceedings":
    case "conference":
      return buildConference(authors, entry);
    default:
      return `${authors}, ${entry.title} (${entry.year})`;
  }
}

/** Format a short subsequent-citation footnote. */
export function formatOSCOLAShort(entry: BibliographyEntry): string {
  const lastNames = parseLastNames(entry.authors);
  const authorStr =
    lastNames.length === 0
      ? entry.citeKey
      : lastNames.length <= 2
        ? lastNames.join(" and ")
        : `${lastNames[0]} and others`;

  // Short title: first 4 words of title
  const shortTitle = entry.title.split(/\s+/).slice(0, 4).join(" ");
  const isBook = entry.entryType === "book" || entry.entryType === "inbook";

  return isBook
    ? `${authorStr}, <em>${shortTitle}</em>`
    : `${authorStr}, '${shortTitle}'`;
}

/** Format a bibliography entry in OSCOLA style (returns HTML string). */
export function formatOSCOLABibliography(entry: BibliographyEntry): string {
  const authors = formatAuthorsOSCOLA(entry.authors);
  let result: string;

  switch (entry.entryType) {
    case "article":
      result = buildArticle(authors, entry);
      break;
    case "book":
      result = buildBook(authors, entry);
      break;
    case "inbook":
    case "incollection":
      result = buildChapter(authors, entry);
      break;
    case "inproceedings":
    case "conference":
      result = buildConference(authors, entry);
      break;
    default:
      result = `${authors}, ${entry.title} (${entry.year})`;
      break;
  }

  if (entry.doi) result += ` DOI: ${entry.doi}`;
  else if (entry.url) result += ` &lt;${entry.url}&gt;`;

  return result;
}

// === Internal helpers ===

function buildArticle(authors: string, entry: BibliographyEntry): string {
  let s = `${authors}, '${entry.title}'`;
  if (entry.journal) {
    s += ` [${entry.year}]`;
    if (entry.volume) s += ` ${entry.volume}`;
    s += ` <em>${entry.journal}</em>`;
    if (entry.pages) s += ` ${entry.pages}`;
  }
  return s;
}

function buildBook(authors: string, entry: BibliographyEntry): string {
  let s = `${authors}, <em>${entry.title}</em>`;
  const parts: string[] = [];
  if (entry.publisher) parts.push(entry.publisher);
  parts.push(entry.year);
  s += ` (${parts.join(" ")})`;
  return s;
}

function buildChapter(authors: string, entry: BibliographyEntry): string {
  let s = `${authors}, '${entry.title}'`;
  if (entry.journal) s += ` in <em>${entry.journal}</em>`;
  const parts: string[] = [];
  if (entry.publisher) parts.push(entry.publisher);
  parts.push(entry.year);
  s += ` (${parts.join(" ")})`;
  if (entry.pages) s += ` ${entry.pages}`;
  return s;
}

function buildConference(authors: string, entry: BibliographyEntry): string {
  let s = `${authors}, '${entry.title}'`;
  if (entry.journal) s += ` in <em>${entry.journal}</em>`;
  s += ` (${entry.year})`;
  if (entry.pages) s += ` ${entry.pages}`;
  return s;
}

/** OSCOLA: First Surname format (not inverted). */
function formatAuthorsOSCOLA(authors: string): string {
  const names = authors
    .split(/\s+and\s+/i)
    .map((name) => {
      const parts = name.trim().split(",");
      if (parts.length === 2) {
        // "Last, First" → "First Last"
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
      return name.trim();
    })
    .filter(Boolean);

  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and others`;
}

function parseLastNames(authors: string): string[] {
  return authors
    .split(/\s+and\s+/i)
    .map((name) => {
      const parts = name.trim().split(",");
      if (parts.length >= 2) return parts[0].trim();
      const words = name.trim().split(/\s+/);
      return words[words.length - 1] ?? name.trim();
    })
    .filter(Boolean);
}
