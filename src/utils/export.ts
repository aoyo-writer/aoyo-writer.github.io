import { sqlDb } from "../db/sqlite";
import type { Work, Chapter, BibliographyEntry } from "../types";
import { generateHTML } from "@tiptap/html";
import { getExportExtensions } from "../extensions";
import { tiptapToDocx } from "./toDocx";
import { formatAPA, formatAPAInText } from "./apa";
import { formatOSCOLABibliography, formatOSCOLAFootnote, formatOSCOLAShort } from "./oscola";

const extensions = getExportExtensions();

function tiptapJsonToHtml(json: string): string {
  try {
    const doc = JSON.parse(json);
    return generateHTML(doc, extensions);
  } catch {
    return "<p></p>";
  }
}

function htmlToMarkdown(html: string): string {
  // Simple HTML-to-Markdown conversion
  let md = html;

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  // Bold, italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, "$1");
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n");

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "\n");

  // Blockquote
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) =>
    content
      .split("\n")
      .map((line: string) => `> ${line}`)
      .join("\n") + "\n\n",
  );

  // Horizontal rule
  md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n\n");

  // Paragraphs and line breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br[^>]*\/?>/gi, "\n");

  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, "");

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}

async function getWorkChapters(workId: number): Promise<Chapter[]> {
  return sqlDb.sql`SELECT * FROM chapters WHERE workId = ${workId} ORDER BY "order"`;
}

export async function exportAsMarkdown(work: Work): Promise<string> {
  const chapters = await getWorkChapters(work.id!);
  let md = `# ${work.title}\n\n`;

  if (work.summary) md += `> ${work.summary}\n\n`;

  // Metadata
  const meta: string[] = [];
  if (work.subjects.length) meta.push(`**Subjects:** ${work.subjects.join(", ")}`);
  if (work.topics.length) meta.push(`**Topics:** ${work.topics.join(", ")}`);
  if (work.keyTerms.length) meta.push(`**Key Terms:** ${work.keyTerms.join(", ")}`);
  if (meta.length) md += meta.join("  \n") + "\n\n---\n\n";

  for (const chapter of chapters) {
    if (chapters.length > 1 || chapter.title) {
      md += `## ${chapter.title || `Chapter ${chapter.order}`}\n\n`;
    }
    const html = tiptapJsonToHtml(chapter.content);
    md += htmlToMarkdown(html) + "\n\n";
  }

  return md;
}

export async function exportAsHtml(work: Work): Promise<string> {
  const chapters = await getWorkChapters(work.id!);

  let body = "";
  for (const chapter of chapters) {
    if (chapters.length > 1 || chapter.title) {
      body += `<h2>${chapter.title || `Chapter ${chapter.order}`}</h2>\n`;
    }
    body += tiptapJsonToHtml(chapter.content) + "\n";
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${work.title}</title>
  <style>
    body {
      max-width: 700px;
      margin: 2em auto;
      padding: 0 1em;
      font-family: Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
      color: #2a2a2a;
    }
    h1 { font-size: 1.75em; font-weight: normal; text-align: center; }
    h2 { font-size: 1.5em; font-weight: normal; border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }
    h3 { font-size: 1.286em; font-weight: normal; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1em; margin-left: 0; color: #555; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.1em 0.3em; border-radius: 2px; font-family: monospace; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 0.5em; }
    th { background: #f5f5f5; font-weight: bold; }
    img { max-width: 100%; }
    .summary { background: #f5f5f5; border: 1px solid #ddd; padding: 1em; margin: 1em 0; border-radius: 4px; }
    .meta { font-size: 0.9em; color: #666; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
    mark.source-ref { background-color: #fff3cd; border-bottom: 2px dotted #d4a800; }
  </style>
</head>
<body>
  <h1>${work.title}</h1>
  ${work.summary ? `<div class="summary"><p>${work.summary}</p></div>` : ""}
  <div class="meta">
    ${work.subjects.length ? `<p><strong>Subjects:</strong> ${work.subjects.join(", ")}</p>` : ""}
    ${work.topics.length ? `<p><strong>Topics:</strong> ${work.topics.join(", ")}</p>` : ""}
    <p><strong>Words:</strong> ${work.wordCount.toLocaleString()}</p>
  </div>
  <hr>
  ${body}
</body>
</html>`;
}

export async function exportAsPdf(work: Work): Promise<void> {
  const chapters = await getWorkChapters(work.id!);
  const entries: BibliographyEntry[] = await sqlDb.sql`SELECT * FROM bibliography WHERE workId = ${work.id!}`;
  const style = work.citationStyle ?? "apa";
  const entriesById = new Map<number, BibliographyEntry>();
  for (const e of entries) {
    if (e.id != null) entriesById.set(e.id, e);
  }

  let body = "";
  for (const chapter of chapters) {
    if (chapters.length > 1 || chapter.title) {
      body += `<h2>${chapter.title || `Chapter ${chapter.order}`}</h2>\n`;
    }
    body += tiptapJsonToHtml(chapter.content) + "\n";
  }

  // Process citations in HTML
  // Match citation spans - try both data-entry-id and entryid attributes
  const seenEntryIds = new Set<number>();
  const footnotes: string[] = [];
  body = body.replace(
    /<span[^>]*data-type="citation"[^>]*>([^<]*)<\/span>/g,
    (match) => {
      const citeKeyMatch = match.match(/data-cite-key="([^"]*)"/);
      const entryIdMatch = match.match(/data-entry-id="([^"]*)"/) ?? match.match(/entryid="([^"]*)"/);
      const citeKey = citeKeyMatch?.[1] ?? "";
      const rawEntryId = entryIdMatch?.[1];
      const entryId = rawEntryId && rawEntryId !== "" && rawEntryId !== "null"
        ? parseInt(rawEntryId)
        : null;
      const entry = entryId != null && !isNaN(entryId) ? entriesById.get(entryId) : undefined;

      if (style === "oscola") {
        const idx = footnotes.length + 1;
        let fnText: string;
        if (entry) {
          const isFirst = entryId != null && !seenEntryIds.has(entryId);
          if (entryId != null) seenEntryIds.add(entryId);
          fnText = isFirst ? formatOSCOLAFootnote(entry) : formatOSCOLAShort(entry);
        } else {
          fnText = citeKey || "?";
        }
        footnotes.push(fnText);
        return `<a href="#fn-${idx}" id="fnref-${idx}" class="fnref"><sup>${idx}</sup></a>`;
      }

      const display = entry ? formatAPAInText(entry) : `(${citeKey || "?"})`;
      return `<span style="color:#990000">${display}</span>`;
    },
  );

  // Footnotes section
  let footnotesHtml = "";
  if (footnotes.length > 0) {
    footnotesHtml = `<section class="footnotes"><h3>Footnotes</h3><ol>`;
    for (let i = 0; i < footnotes.length; i++) {
      const num = i + 1;
      footnotesHtml += `<li id="fn-${num}"><span class="fn-content">${footnotes[i]}</span> <a href="#fnref-${num}" class="fn-back" title="Back to text">\u21A9</a></li>`;
    }
    footnotesHtml += `</ol></section>`;
  }

  // Bibliography section
  let bibHtml = "";
  if (entries.length > 0) {
    bibHtml = `<section class="bibliography"><h3>Bibliography</h3>`;
    for (const entry of entries) {
      const formatted = style === "oscola"
        ? formatOSCOLABibliography(entry)
        : formatAPA(entry);
      bibHtml += `<p class="bib-entry">${formatted}</p>`;
    }
    bibHtml += `</section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${work.title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      @page { margin: 2.5cm; size: A4; }
    }
    body {
      max-width: 700px;
      margin: 2em auto;
      padding: 0 1em;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #2a2a2a;
    }
    h1 { font-size: 1.75em; font-weight: normal; text-align: center; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; font-weight: normal; border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }
    h3 { font-size: 1.286em; font-weight: normal; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1em; margin-left: 0; color: #555; font-style: italic; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; font-family: "Courier New", monospace; font-size: 0.9em; }
    code { background: #f5f5f5; padding: 0.1em 0.3em; border-radius: 2px; font-family: "Courier New", monospace; font-size: 0.9em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 0.5em; }
    th { background: #f5f5f5; font-weight: bold; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
    .summary { background: #f5f5f5; border: 1px solid #ddd; padding: 1em; margin: 1em 0; border-radius: 4px; font-style: italic; color: #555; }
    .meta { font-size: 0.9em; color: #666; margin-bottom: 1em; }
    .fnref { color: #990000; text-decoration: none; }
    .fnref sup { font-size: 0.75em; font-weight: bold; }
    .footnotes { margin-top: 3em; padding-top: 1em; border-top: 1px solid #999; font-size: 0.85em; line-height: 1.5; }
    .footnotes h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.5em; }
    .footnotes ol { padding-left: 1.5em; margin: 0; }
    .footnotes li { margin-bottom: 0.5em; }
    .footnotes .fn-back { color: #990000; text-decoration: none; font-size: 0.85em; margin-left: 0.3em; }
    .bibliography { margin-top: 2em; padding-top: 1em; border-top: 1px solid #999; }
    .bibliography h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.5em; }
    .bib-entry { font-size: 0.9em; margin-bottom: 0.5em; padding-left: 2em; text-indent: -2em; }
    mark.source-ref { background-color: #fff3cd; border-bottom: 2px dotted #d4a800; }
  </style>
</head>
<body>
  <h1>${work.title}</h1>
  ${work.summary ? `<div class="summary">${work.summary}</div>` : ""}
  <div class="meta">
    ${work.subjects.length ? `<p><strong>Subjects:</strong> ${work.subjects.join(", ")}</p>` : ""}
    ${work.topics.length ? `<p><strong>Topics:</strong> ${work.topics.join(", ")}</p>` : ""}
    ${work.keyTerms.length ? `<p><strong>Key Terms:</strong> ${work.keyTerms.join(", ")}</p>` : ""}
    <p><strong>Words:</strong> ${work.wordCount.toLocaleString()}</p>
  </div>
  <hr>
  ${body}
  ${footnotesHtml}
  ${bibHtml}
</body>
</html>`;

  // Open in new window and trigger print
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  }
}

export async function exportAsDocx(work: Work): Promise<Blob> {
  const chapters = await getWorkChapters(work.id!);
  const entries: BibliographyEntry[] = await sqlDb.sql`SELECT * FROM bibliography WHERE workId = ${work.id!}`;
  return tiptapToDocx(work, chapters, entries);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
