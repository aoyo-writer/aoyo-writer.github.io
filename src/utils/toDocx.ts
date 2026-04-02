import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  FootnoteReferenceRun,
  ImageRun,
} from "docx";
import type { JSONContent } from "@tiptap/core";
import type { Work, BibliographyEntry, CitationStyle } from "../types";
import { formatAPA, formatAPAInText } from "./apa";
import { formatOSCOLAFootnote, formatOSCOLAShort, formatOSCOLABibliography } from "./oscola";

/**
 * Convert a Work (with chapters + bibliography entries) to a .docx Blob.
 */
export async function tiptapToDocx(
  work: Work,
  chapters: { title: string; content: string; order: number }[],
  entries: BibliographyEntry[],
): Promise<Blob> {
  const style = work.citationStyle ?? "apa";
  const entriesById = new Map<number, BibliographyEntry>();
  for (const e of entries) {
    if (e.id != null) entriesById.set(e.id, e);
  }

  // Track footnotes for OSCOLA
  const footnotes: Record<string, { children: Paragraph[] }> = {};
  let footnoteId = 1;
  const seenEntryIds = new Set<number>();

  const allParagraphs: Paragraph[] = [];

  // Title
  allParagraphs.push(
    new Paragraph({
      children: [new TextRun({ text: work.title, bold: true, size: 32 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Summary
  if (work.summary) {
    allParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: work.summary, italics: true, color: "555555" })],
        spacing: { after: 200 },
      }),
    );
  }

  // Metadata
  const metaLines: string[] = [];
  if (work.subjects.length) metaLines.push(`Subjects: ${work.subjects.join(", ")}`);
  if (work.topics.length) metaLines.push(`Topics: ${work.topics.join(", ")}`);
  if (work.keyTerms.length) metaLines.push(`Key Terms: ${work.keyTerms.join(", ")}`);
  for (const line of metaLines) {
    allParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 20, color: "666666" })],
      }),
    );
  }
  if (metaLines.length) {
    allParagraphs.push(new Paragraph({ children: [] }));
  }

  // Chapters
  for (const chapter of chapters) {
    if (chapters.length > 1 || chapter.title) {
      allParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: chapter.title || `Chapter ${chapter.order}` })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );
    }

    let doc: JSONContent;
    try {
      doc = JSON.parse(chapter.content);
    } catch {
      continue;
    }

    const paras = await convertNodeToDocx(
      doc,
      entriesById,
      style,
      footnotes,
      { current: footnoteId },
      seenEntryIds,
    );
    footnoteId += Object.keys(footnotes).length - (footnoteId - 1);
    allParagraphs.push(...paras);
  }

  // Bibliography section
  if (entries.length > 0) {
    allParagraphs.push(new Paragraph({ children: [] }));
    allParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: "Bibliography" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    for (const entry of entries) {
      const formatted = style === "oscola"
        ? stripHtml(formatOSCOLABibliography(entry))
        : stripHtml(formatAPA(entry));
      allParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: formatted, size: 20 })],
          spacing: { after: 120 },
          indent: { left: 720, hanging: 720 },
        }),
      );
    }
  }

  const docx = new Document({
    sections: [{ children: allParagraphs }],
    footnotes,
  });

  return Packer.toBlob(docx);
}

async function convertNodeToDocx(
  node: JSONContent,
  entriesById: Map<number, BibliographyEntry>,
  style: CitationStyle,
  footnotes: Record<string, { children: Paragraph[] }>,
  footnoteCounter: { current: number },
  seenEntryIds: Set<number>,
): Promise<Paragraph[]> {
  if (!node) return [];

  switch (node.type) {
    case "doc": {
      const results = await Promise.all(
        (node.content ?? []).map((n) =>
          convertNodeToDocx(n, entriesById, style, footnotes, footnoteCounter, seenEntryIds),
        ),
      );
      return results.flat();
    }

    case "paragraph": {
      const runs = convertInlineToRuns(
        node.content,
        entriesById,
        style,
        footnotes,
        footnoteCounter,
        seenEntryIds,
      );
      const align = getAlignment(node.attrs?.textAlign);
      return [
        new Paragraph({
          children: runs,
          alignment: align,
          spacing: { after: 120 },
        }),
      ];
    }

    case "heading": {
      const level = node.attrs?.level ?? 1;
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][Math.min(level - 1, 5)];
      const runs = convertInlineToRuns(
        node.content,
        entriesById,
        style,
        footnotes,
        footnoteCounter,
        seenEntryIds,
      );
      return [
        new Paragraph({
          children: runs,
          heading: headingLevel,
          spacing: { before: 240, after: 120 },
        }),
      ];
    }

    case "bulletList":
    case "taskList":
      return (node.content ?? []).map((item) => {
        const runs = convertInlineToRuns(
          getListItemContent(item),
          entriesById,
          style,
          footnotes,
          footnoteCounter,
          seenEntryIds,
        );
        if (node.type === "taskList") {
          const checked = item.attrs?.checked ? "[x] " : "[ ] ";
          runs.unshift(new TextRun({ text: checked }));
        }
        return new Paragraph({
          children: runs,
          bullet: { level: 0 },
          spacing: { after: 60 },
        });
      });

    case "orderedList":
      return (node.content ?? []).map((item) => {
        const runs = convertInlineToRuns(
          getListItemContent(item),
          entriesById,
          style,
          footnotes,
          footnoteCounter,
          seenEntryIds,
        );
        return new Paragraph({
          children: runs,
          numbering: { reference: "default-numbering", level: 0 },
          spacing: { after: 60 },
        });
      });

    case "blockquote": {
      const results = await Promise.all(
        (node.content ?? []).map((n) =>
          convertNodeToDocx(n, entriesById, style, footnotes, footnoteCounter, seenEntryIds),
        ),
      );
      return results.flat().map(
        (p) =>
          new Paragraph({
            ...p,
            indent: { left: 720 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 6, color: "DDDDDD", space: 8 },
            },
          }),
      );
    }

    case "codeBlock": {
      const text = (node.content ?? []).map((n) => n.text ?? "").join("");
      return text.split("\n").map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: "Courier New",
                size: 18,
              }),
            ],
            shading: { fill: "F5F5F5" },
            spacing: { after: 0 },
          }),
      );
    }

    case "horizontalRule":
      return [
        new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
          spacing: { before: 200, after: 200 },
        }),
      ];

    case "table":
      return [convertTableToDocx(node, entriesById, style, footnotes, footnoteCounter, seenEntryIds)].flatMap(
        (t) => [new Paragraph({ children: [] }), ...([t] as unknown as Paragraph[])],
      );

    case "image": {
      const src = node.attrs?.src ?? "";
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        // Detect dimensions from the URL or use defaults
        const dimensions = await getImageDimensions(src);

        return [
          new Paragraph({
            children: [
              new ImageRun({
                data: uint8,
                transformation: {
                  width: Math.min(dimensions.width, 600),
                  height: Math.min(
                    dimensions.height,
                    600 * (dimensions.height / dimensions.width),
                  ),
                },
                type: getImageType(src, response.headers.get("content-type")),
              }),
            ],
            spacing: { before: 120, after: 120 },
          }),
        ];
      } catch {
        // Fallback to placeholder if fetch fails
        return [
          new Paragraph({
            children: [
              new TextRun({
                text: `[Image could not be embedded: ${src}]`,
                italics: true,
                color: "999999",
              }),
            ],
          }),
        ];
      }
    }

    case "mathInline":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: node.attrs?.latex ?? "",
              font: "Cambria Math",
              italics: true,
            }),
          ],
        }),
      ];

    case "mathBlock":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: node.attrs?.latex ?? "",
              font: "Cambria Math",
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        }),
      ];

    default:
      if (node.content) {
        const results = await Promise.all(
          (node.content ?? []).map((n) =>
            convertNodeToDocx(n, entriesById, style, footnotes, footnoteCounter, seenEntryIds),
          ),
        );
        return results.flat();
      }
      return [];
  }
}

function convertInlineToRuns(
  content: JSONContent[] | undefined,
  entriesById: Map<number, BibliographyEntry>,
  style: CitationStyle,
  footnotes: Record<string, { children: Paragraph[] }>,
  footnoteCounter: { current: number },
  seenEntryIds: Set<number>,
): (TextRun | FootnoteReferenceRun)[] {
  if (!content) return [];

  const runs: (TextRun | FootnoteReferenceRun)[] = [];

  for (const node of content) {
    if (node.type === "text") {
      const marks = node.marks ?? [];
      const bold = marks.some((m) => m.type === "bold");
      const italic = marks.some((m) => m.type === "italic");
      const underline = marks.some((m) => m.type === "underline");
      const strike = marks.some((m) => m.type === "strike");
      const code = marks.some((m) => m.type === "code");
      const superscript = marks.some((m) => m.type === "superscript");
      const subscript = marks.some((m) => m.type === "subscript");
      const hasSourceRef = marks.some((m) => m.type === "sourceRef");
      const highlight = marks.some((m) => m.type === "highlight") || hasSourceRef;

      runs.push(
        new TextRun({
          text: node.text ?? "",
          bold,
          italics: italic,
          underline: underline ? {} : undefined,
          strike,
          font: code ? "Courier New" : undefined,
          superScript: superscript,
          subScript: subscript,
          highlight: highlight ? "yellow" : undefined,
        }),
      );
    } else if (node.type === "hardBreak") {
      runs.push(new TextRun({ break: 1 }));
    } else if (node.type === "citation") {
      const entryId = node.attrs?.entryId as number | null;
      const citeKey = (node.attrs?.citeKey as string) ?? "";
      const entry = entryId != null ? entriesById.get(entryId) : undefined;

      if (style === "oscola") {
        // Add footnote
        const fnId = footnoteCounter.current++;
        const isFirst = entryId != null && !seenEntryIds.has(entryId);
        if (entryId != null) seenEntryIds.add(entryId);

        const fnText = entry
          ? isFirst
            ? stripHtml(formatOSCOLAFootnote(entry))
            : stripHtml(formatOSCOLAShort(entry))
          : citeKey;

        footnotes[String(fnId)] = {
          children: [new Paragraph({ children: [new TextRun({ text: fnText })] })],
        };
        runs.push(new FootnoteReferenceRun(fnId));
      } else {
        // APA inline
        const display = entry ? formatAPAInText(entry) : `(${citeKey || "?"})`;
        runs.push(
          new TextRun({
            text: display,
            color: "990000",
          }),
        );
      }
    } else if (node.type === "mathInline") {
      runs.push(
        new TextRun({
          text: node.attrs?.latex ?? "",
          font: "Cambria Math",
          italics: true,
        }),
      );
    }
  }

  return runs;
}

function getListItemContent(item: JSONContent): JSONContent[] | undefined {
  // List items contain paragraph nodes; extract inline content from first paragraph
  const firstPara = item.content?.find((n) => n.type === "paragraph");
  return firstPara?.content;
}

function getAlignment(textAlign: string | undefined): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

function convertTableToDocx(
  node: JSONContent,
  entriesById: Map<number, BibliographyEntry>,
  style: CitationStyle,
  footnotes: Record<string, { children: Paragraph[] }>,
  footnoteCounter: { current: number },
  seenEntryIds: Set<number>,
): Table {
  const rows = (node.content ?? []).map((row) => {
    const cells = (row.content ?? []).map((cell) => {
      const isHeader = cell.type === "tableHeader";
      const runs = convertInlineToRuns(
        cell.content?.[0]?.content,
        entriesById,
        style,
        footnotes,
        footnoteCounter,
        seenEntryIds,
      );
      return new TableCell({
        children: [new Paragraph({ children: runs })],
        shading: isHeader ? { fill: "F5F5F5" } : undefined,
        width: { size: 100, type: WidthType.AUTO },
      });
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<em>(.*?)<\/em>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

/** Load an image from a URL and get its natural dimensions. */
function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 400, height: 300 });
    img.src = src;
  });
}

/** Determine docx image type from URL extension or content-type header. */
function getImageType(
  src: string,
  contentType: string | null,
): "jpg" | "png" | "gif" | "bmp" {
  if (contentType) {
    if (contentType.includes("png")) return "png";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("bmp")) return "bmp";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  }
  const ext = src.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  if (ext === "png") return "png";
  if (ext === "gif") return "gif";
  if (ext === "bmp") return "bmp";
  return "jpg";
}
