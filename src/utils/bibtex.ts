import type { BibliographyEntry } from "../types";

type ParsedEntry = Omit<BibliographyEntry, "id" | "workId" | "createdAt">;

/**
 * Parse a BibTeX string into bibliography entries.
 *
 * Handles standard BibTeX format:
 * @type{key,
 *   field = {value},
 *   field = "value",
 *   field = bareword,
 * }
 */
export function parseBibTeX(input: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Match each @type{key, ... } block
  const entryRegex = /@(\w+)\s*\{([^,]+),\s*([\s\S]*?)\n\s*\}/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(input)) !== null) {
    const entryType = match[1].toLowerCase();
    const citeKey = match[2].trim();
    const fieldsStr = match[3];

    // Skip non-entry types
    if (["comment", "preamble", "string"].includes(entryType)) continue;

    const fields = parseFields(fieldsStr);

    entries.push({
      citeKey,
      entryType,
      title: fields.title ?? "",
      authors: fields.author ?? "",
      year: fields.year ?? "",
      journal: fields.journal,
      volume: fields.volume,
      pages: fields.pages,
      publisher: fields.publisher,
      url: fields.url,
      doi: fields.doi,
      abstract: fields.abstract,
      raw: match[0],
    });
  }

  return entries;
}

function parseFields(fieldsStr: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Match field = {value} or field = "value" or field = bareword
  const fieldRegex =
    /(\w+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|(\w+))/g;
  let fieldMatch: RegExpExecArray | null;

  while ((fieldMatch = fieldRegex.exec(fieldsStr)) !== null) {
    const key = fieldMatch[1].toLowerCase();
    const value =
      fieldMatch[2] ?? fieldMatch[3] ?? fieldMatch[4] ?? "";
    fields[key] = value.trim();
  }

  return fields;
}
