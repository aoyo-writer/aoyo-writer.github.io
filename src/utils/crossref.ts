export interface CrossRefWork {
  title: string;
  authors: string;
  year: string;
  journal?: string;
  volume?: string;
  pages?: string;
  publisher?: string;
  doi: string;
  url?: string;
  entryType: string;
  abstract?: string;
}

/**
 * Fetch metadata from CrossRef by DOI.
 * No API key required. Include polite mailto for better rate limits.
 */
export async function fetchByDoi(doi: string): Promise<CrossRefWork | null> {
  const cleanDoi = doi
    .replace(/^https?:\/\/doi\.org\//, "")
    .replace(/^doi:/, "")
    .trim();
  if (!cleanDoi) return null;

  try {
    const resp = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`,
      { headers: { "User-Agent": "AOYO/1.0 (mailto:aoyo@example.com)" } },
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const item = data.message;

    return {
      title: item.title?.[0] ?? "",
      authors: (item.author ?? [])
        .map(
          (a: { family?: string; given?: string }) =>
            `${a.family ?? ""}${a.given ? ", " + a.given : ""}`,
        )
        .join(" and "),
      year: String(
        item.published?.["date-parts"]?.[0]?.[0] ??
          item.created?.["date-parts"]?.[0]?.[0] ??
          "",
      ),
      journal: item["container-title"]?.[0],
      volume: item.volume,
      pages: item.page,
      publisher: item.publisher,
      doi: cleanDoi,
      url: item.URL,
      entryType: mapCrossRefType(item.type),
      abstract: item.abstract
        ? item.abstract.replace(/<[^>]*>/g, "").slice(0, 500)
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verify that a DOI resolves by checking CrossRef.
 */
export async function verifyDoi(doi: string): Promise<boolean> {
  const cleanDoi = doi
    .replace(/^https?:\/\/doi\.org\//, "")
    .replace(/^doi:/, "")
    .trim();
  if (!cleanDoi) return false;

  try {
    const resp = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`,
      {
        method: "HEAD",
        headers: { "User-Agent": "AOYO/1.0 (mailto:aoyo@example.com)" },
      },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

function mapCrossRefType(type: string): string {
  const map: Record<string, string> = {
    "journal-article": "article",
    book: "book",
    "book-chapter": "inbook",
    "proceedings-article": "inproceedings",
    dissertation: "thesis",
    report: "techreport",
    "posted-content": "misc",
    "peer-review": "article",
  };
  return map[type] ?? "misc";
}

/**
 * Generate a cite key from author and year (e.g., "smith2024").
 */
export function generateCiteKey(authors: string, year: string): string {
  const firstAuthor = authors.split(/\s+and\s+/i)[0] ?? "";
  const lastName = firstAuthor.split(",")[0]?.trim().toLowerCase() ?? "unknown";
  const clean = lastName.replace(/[^a-z]/g, "");
  return `${clean}${year}`;
}
