export interface OpenAlexResult {
  title: string;
  authors: string;
  year: string;
  doi?: string;
  journal?: string;
  openAccessUrl?: string;
  citedByCount?: number;
  abstract?: string;
}

/**
 * Search OpenAlex for papers by query.
 * No API key required. Include polite mailto for better rate limits.
 */
export async function searchPapers(
  query: string,
  page = 1,
  perPage = 10,
): Promise<{ results: OpenAlexResult[]; totalCount: number }> {
  const resp = await fetch(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&mailto=aoyo@example.com`,
  );
  if (!resp.ok) throw new Error(`OpenAlex search failed: ${resp.status}`);

  const data = await resp.json();

  const results: OpenAlexResult[] = (data.results ?? []).map(
    (item: Record<string, unknown>) => {
      const authorships = (item.authorships ?? []) as Array<{
        author: { display_name: string };
      }>;
      const primaryLocation = item.primary_location as
        | { source?: { display_name?: string } }
        | null;
      const openAccess = item.open_access as
        | { oa_url?: string }
        | null;

      // Reconstruct abstract from inverted index
      const abstractIndex = item.abstract_inverted_index as Record<string, number[]> | null;
      let abstract: string | undefined;
      if (abstractIndex) {
        const words: [string, number][] = [];
        for (const [word, positions] of Object.entries(abstractIndex)) {
          for (const pos of positions) words.push([word, pos]);
        }
        words.sort((a, b) => a[1] - b[1]);
        abstract = words.map(([w]) => w).join(" ");
      }

      return {
        title: (item.title as string) ?? "",
        authors: authorships.map((a) => a.author.display_name).join(" and "),
        year: String((item.publication_year as number) ?? ""),
        doi: ((item.doi as string) ?? "").replace("https://doi.org/", "") || undefined,
        journal: primaryLocation?.source?.display_name,
        openAccessUrl: openAccess?.oa_url,
        citedByCount: item.cited_by_count as number | undefined,
        abstract,
      };
    },
  );

  return {
    results,
    totalCount: (data.meta?.count as number) ?? 0,
  };
}
