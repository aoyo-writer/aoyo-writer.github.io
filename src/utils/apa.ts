import type { BibliographyEntry } from "../types";

/** Format a bibliography entry in APA 7th edition style (returns HTML string). */
export function formatAPA(entry: BibliographyEntry): string {
  const authors = formatAuthorsAPA(entry.authors);
  let citation = `${authors} (${entry.year}). `;

  switch (entry.entryType) {
    case "article":
      citation += `${entry.title}. `;
      if (entry.journal) citation += `<em>${entry.journal}</em>`;
      if (entry.volume) citation += `, <em>${entry.volume}</em>`;
      if (entry.pages) citation += `, ${entry.pages}`;
      citation += ".";
      break;
    case "book":
    case "inbook":
      citation += `<em>${entry.title}</em>. `;
      if (entry.publisher) citation += `${entry.publisher}.`;
      break;
    case "inproceedings":
    case "conference":
      citation += `${entry.title}. `;
      if (entry.journal) citation += `In <em>${entry.journal}</em>`;
      if (entry.pages) citation += ` (pp. ${entry.pages})`;
      citation += ".";
      if (entry.publisher) citation += ` ${entry.publisher}.`;
      break;
    default:
      citation += `${entry.title}.`;
      break;
  }

  if (entry.doi) citation += ` https://doi.org/${entry.doi}`;
  else if (entry.url) citation += ` ${entry.url}`;

  return citation;
}

/** Format a short in-text APA citation: (Author, Year) */
export function formatAPAInText(entry: BibliographyEntry): string {
  const lastNames = parseLastNames(entry.authors);

  let authorStr: string;
  if (lastNames.length === 0) {
    authorStr = entry.citeKey;
  } else if (lastNames.length === 1) {
    authorStr = lastNames[0];
  } else if (lastNames.length === 2) {
    authorStr = `${lastNames[0]} & ${lastNames[1]}`;
  } else {
    authorStr = `${lastNames[0]} et al.`;
  }

  return `(${authorStr}, ${entry.year})`;
}

function formatAuthorsAPA(authors: string): string {
  // BibTeX uses "and" to separate authors
  const names = authors
    .split(/\s+and\s+/i)
    .map((name) => {
      const parts = name.trim().split(",");
      if (parts.length === 2) {
        // "Last, First" format
        const last = parts[0].trim();
        const first = parts[1].trim();
        const initials = first
          .split(/\s+/)
          .map((n) => n[0] + ".")
          .join(" ");
        return `${last}, ${initials}`;
      }
      // "First Last" format
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) {
        const last = words[words.length - 1];
        const initials = words
          .slice(0, -1)
          .map((n) => n[0] + ".")
          .join(" ");
        return `${last}, ${initials}`;
      }
      return name.trim();
    })
    .filter(Boolean);

  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}, & ${names[1]}`;
  if (names.length <= 20) {
    return (
      names.slice(0, -1).join(", ") + ", & " + names[names.length - 1]
    );
  }
  return (
    names.slice(0, 19).join(", ") + ", ... " + names[names.length - 1]
  );
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
