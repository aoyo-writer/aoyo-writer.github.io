import type { JSONContent } from "@tiptap/core";
import type { Work, BibliographyEntry } from "../types";
import { formatAPA } from "./apa";
import { formatOSCOLABibliography } from "./oscola";

export function tiptapJsonToLatex(doc: JSONContent): string {
  const preamble = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{ulem}
\\usepackage{soul}

\\begin{document}

`;
  const postamble = `
\\end{document}
`;

  const body = convertNode(doc);
  return preamble + body + postamble;
}

function convertNode(node: JSONContent): string {
  if (!node) return "";

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map(convertNode).join("\n\n");

    case "paragraph": {
      const text = convertInlineContent(node.content);
      return text || "";
    }

    case "heading": {
      const level = node.attrs?.level ?? 1;
      const commands = [
        "section",
        "subsection",
        "subsubsection",
        "paragraph",
        "subparagraph",
        "subparagraph",
      ];
      const cmd = commands[Math.min(level - 1, commands.length - 1)];
      return `\\${cmd}{${convertInlineContent(node.content)}}`;
    }

    case "bulletList":
      return `\\begin{itemize}\n${(node.content ?? []).map(convertNode).join("\n")}\n\\end{itemize}`;

    case "orderedList":
      return `\\begin{enumerate}\n${(node.content ?? []).map(convertNode).join("\n")}\n\\end{enumerate}`;

    case "listItem":
      return `  \\item ${(node.content ?? []).map(convertNode).join(" ")}`;

    case "taskList":
      return `\\begin{itemize}\n${(node.content ?? []).map(convertNode).join("\n")}\n\\end{itemize}`;

    case "taskItem": {
      const checked = node.attrs?.checked ? "$\\boxtimes$" : "$\\square$";
      return `  \\item[${checked}] ${(node.content ?? []).map(convertNode).join(" ")}`;
    }

    case "blockquote":
      return `\\begin{quote}\n${(node.content ?? []).map(convertNode).join("\n")}\n\\end{quote}`;

    case "codeBlock": {
      const text = (node.content ?? [])
        .map((n) => n.text ?? "")
        .join("");
      return `\\begin{verbatim}\n${text}\n\\end{verbatim}`;
    }

    case "horizontalRule":
      return "\\noindent\\rule{\\textwidth}{0.4pt}";

    case "table":
      return convertTable(node);

    case "image":
      return `\\includegraphics[width=\\textwidth]{${node.attrs?.src ?? ""}}`;

    case "mathInline":
      return `$${node.attrs?.latex ?? ""}$`;

    case "mathBlock":
      return `\\[\n${node.attrs?.latex ?? ""}\n\\]`;

    case "citation":
      return `\\cite{${node.attrs?.citeKey ?? ""}}`;

    case "hardBreak":
      return "\\\\";

    default:
      if (node.content) {
        return (node.content ?? []).map(convertNode).join("");
      }
      return node.text ? escapeLatex(node.text) : "";
  }
}

function convertInlineContent(content?: JSONContent[]): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "text") {
        let text = escapeLatex(node.text ?? "");
        for (const mark of node.marks ?? []) {
          switch (mark.type) {
            case "bold":
              text = `\\textbf{${text}}`;
              break;
            case "italic":
              text = `\\textit{${text}}`;
              break;
            case "underline":
              text = `\\underline{${text}}`;
              break;
            case "strike":
              text = `\\sout{${text}}`;
              break;
            case "code":
              text = `\\texttt{${text}}`;
              break;
            case "superscript":
              text = `\\textsuperscript{${text}}`;
              break;
            case "subscript":
              text = `\\textsubscript{${text}}`;
              break;
            case "highlight":
              text = `\\hl{${text}}`;
              break;
            case "sourceRef":
              text = `\\hl{${text}}`;
              break;
          }
        }
        return text;
      }
      if (node.type === "hardBreak") return "\\\\";
      return convertNode(node);
    })
    .join("");
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function convertTable(node: JSONContent): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return "";

  const firstRow = rows[0].content ?? [];
  const cols = firstRow.length;
  const colSpec = Array(cols).fill("l").join(" | ");

  let latex = `\\begin{tabular}{| ${colSpec} |}\n\\hline\n`;
  for (const row of rows) {
    const cells = (row.content ?? []).map((cell) =>
      (cell.content ?? []).map(convertNode).join(""),
    );
    latex += cells.join(" & ") + " \\\\\n\\hline\n";
  }
  latex += "\\end{tabular}";
  return latex;
}

/**
 * Build a complete LaTeX document from a work with all chapters and bibliography.
 * For OSCOLA: citations become \footnote{text} instead of \cite{key}.
 */
export function buildFullLatexDocument(
  work: Work,
  chapters: { title: string; content: string; order: number }[],
  entries: BibliographyEntry[],
): string {
  const style = work.citationStyle ?? "apa";
  const entriesById = new Map<number, BibliographyEntry>();
  for (const e of entries) {
    if (e.id != null) entriesById.set(e.id, e);
  }

  let preamble = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{ulem}
\\usepackage{soul}

\\title{${escapeLatex(work.title)}}
\\date{}

\\begin{document}

\\maketitle

`;

  if (work.summary) {
    preamble += `\\begin{abstract}\n${escapeLatex(work.summary)}\n\\end{abstract}\n\n`;
  }

  let body = "";
  for (const chapter of chapters) {
    if (chapters.length > 1 || chapter.title) {
      body += `\\section{${escapeLatex(chapter.title || `Chapter ${chapter.order}`)}}\n\n`;
    }
    let doc: JSONContent;
    try {
      doc = JSON.parse(chapter.content);
    } catch {
      continue;
    }

    if (style === "oscola") {
      body += convertNodeOSCOLA(doc, entriesById) + "\n\n";
    } else {
      body += convertNode(doc) + "\n\n";
    }
  }

  // Bibliography
  let bib = "";
  if (entries.length > 0) {
    if (style === "oscola") {
      bib += "\n\\section*{Bibliography}\n\n";
      for (const entry of entries) {
        bib += stripHtml(formatOSCOLABibliography(entry)) + "\n\n";
      }
    } else {
      bib += "\n\\begin{thebibliography}{99}\n\n";
      for (const entry of entries) {
        bib += `\\bibitem{${entry.citeKey}} ${stripHtml(formatAPA(entry))}\n\n`;
      }
      bib += "\\end{thebibliography}\n";
    }
  }

  return preamble + body + bib + "\n\\end{document}\n";
}

/** Convert TipTap JSON to LaTeX with OSCOLA footnotes. */
function convertNodeOSCOLA(
  node: JSONContent,
  entriesById: Map<number, BibliographyEntry>,
  seenEntryIds = new Set<number>(),
): string {
  if (!node) return "";

  if (node.type === "citation") {
    const entryId = node.attrs?.entryId as number | null;
    const entry = entryId != null ? entriesById.get(entryId) : undefined;
    if (entry) {
      const isFirst = entryId != null && !seenEntryIds.has(entryId);
      if (entryId != null) seenEntryIds.add(entryId);
      const text = isFirst
        ? stripHtml(formatOSCOLABibliography(entry))
        : entry.authors.split(/\s+and\s+/i)[0]?.split(",")[0]?.trim() ?? entry.citeKey;
      return `\\footnote{${escapeLatex(text)}}`;
    }
    return `\\footnote{${escapeLatex(node.attrs?.citeKey ?? "")}}`;
  }

  if (node.type === "doc") {
    return (node.content ?? [])
      .map((n) => convertNodeOSCOLA(n, entriesById, seenEntryIds))
      .join("\n\n");
  }

  if (node.type === "paragraph") {
    return convertInlineContentOSCOLA(node.content, entriesById, seenEntryIds);
  }

  if (node.content) {
    // For nodes with content, process children with OSCOLA awareness
    const children = (node.content ?? [])
      .map((n) => convertNodeOSCOLA(n, entriesById, seenEntryIds));

    // Delegate the structural wrapping to the original converter but with OSCOLA content
    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level ?? 1;
        const commands = ["section", "subsection", "subsubsection", "paragraph", "subparagraph", "subparagraph"];
        const cmd = commands[Math.min(level - 1, commands.length - 1)];
        return `\\${cmd}{${convertInlineContentOSCOLA(node.content, entriesById, seenEntryIds)}}`;
      }
      case "bulletList":
        return `\\begin{itemize}\n${children.join("\n")}\n\\end{itemize}`;
      case "orderedList":
        return `\\begin{enumerate}\n${children.join("\n")}\n\\end{enumerate}`;
      case "listItem":
        return `  \\item ${children.join(" ")}`;
      case "blockquote":
        return `\\begin{quote}\n${children.join("\n")}\n\\end{quote}`;
      default:
        return children.join("");
    }
  }

  // Fall through to original converter for non-content nodes
  return convertNode(node);
}

function convertInlineContentOSCOLA(
  content: JSONContent[] | undefined,
  entriesById: Map<number, BibliographyEntry>,
  seenEntryIds: Set<number>,
): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "citation") {
        return convertNodeOSCOLA(node, entriesById, seenEntryIds);
      }
      if (node.type === "text") {
        let text = escapeLatex(node.text ?? "");
        for (const mark of node.marks ?? []) {
          switch (mark.type) {
            case "bold": text = `\\textbf{${text}}`; break;
            case "italic": text = `\\textit{${text}}`; break;
            case "underline": text = `\\underline{${text}}`; break;
            case "strike": text = `\\sout{${text}}`; break;
            case "code": text = `\\texttt{${text}}`; break;
            case "superscript": text = `\\textsuperscript{${text}}`; break;
            case "subscript": text = `\\textsubscript{${text}}`; break;
            case "highlight": text = `\\hl{${text}}`; break;
            case "sourceRef": text = `\\hl{${text}}`; break;
          }
        }
        return text;
      }
      if (node.type === "hardBreak") return "\\\\";
      return convertNodeOSCOLA(node, entriesById, seenEntryIds);
    })
    .join("");
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
