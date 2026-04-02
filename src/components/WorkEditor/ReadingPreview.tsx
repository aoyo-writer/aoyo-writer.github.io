import { useMemo, useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { generateHTML } from "@tiptap/html";
import { getExportExtensions } from "../../extensions";
import katex from "katex";
import type { Editor } from "@tiptap/react";
import type { Work, BibliographyEntry } from "../../types";
import { useBibliography } from "../../db/useWorks";
import { formatOSCOLAFootnote, formatOSCOLAShort } from "../../utils/oscola";
import { formatAPAInText } from "../../utils/apa";

interface ReadingPreviewProps {
  editor: Editor | null;
  work: Work;
}

/** Post-process HTML to render math nodes with KaTeX. */
function renderMathInHtml(html: string): string {
  // Inline math
  html = html.replace(
    /<span[^>]*data-type="mathInline"[^>]*data-latex="([^"]*)"[^>]*>.*?<\/span>/g,
    (_, latex) => {
      const decoded = latex
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      try {
        return `<span class="math-inline">${katex.renderToString(decoded, { throwOnError: false, displayMode: false })}</span>`;
      } catch {
        return `<span style="color:#900">${decoded}</span>`;
      }
    },
  );
  // Block math
  html = html.replace(
    /<div[^>]*data-type="mathBlock"[^>]*data-latex="([^"]*)"[^>]*>.*?<\/div>/g,
    (_, latex) => {
      const decoded = latex
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      try {
        return `<div class="math-block" style="text-align:center;margin:1em 0">${katex.renderToString(decoded, { throwOnError: false, displayMode: true })}</div>`;
      } catch {
        return `<div style="color:#900;text-align:center">${decoded}</div>`;
      }
    },
  );
  return html;
}

/** Process citations in preview HTML based on citation style. */
function processCitations(
  html: string,
  style: "apa" | "oscola",
  entriesById: Map<number, BibliographyEntry>,
): { html: string; footnotes: string[] } {
  const footnotes: string[] = [];
  const seenEntryIds = new Set<number>();

  const processed = html.replace(
    /<span[^>]*data-type="citation"[^>]*>[^<]*<\/span>/g,
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
        let footnoteText: string;
        if (entry) {
          const isFirst = entryId != null && !seenEntryIds.has(entryId);
          if (entryId != null) seenEntryIds.add(entryId);
          footnoteText = isFirst
            ? formatOSCOLAFootnote(entry)
            : formatOSCOLAShort(entry);
        } else {
          footnoteText = citeKey || "?";
        }
        footnotes.push(footnoteText);
        return `<sup style="color:#990000;font-weight:bold;font-size:0.75em;cursor:default" title="${footnoteText.replace(/"/g, "&quot;").replace(/<[^>]*>/g, "")}">${idx}</sup>`;
      }

      // APA: inline (Author, Year)
      const display = entry ? formatAPAInText(entry) : `(${citeKey || "?"})`;
      return `<span style="color:#990000;border-bottom:1px dotted #990000">${display}</span>`;
    },
  );

  return { html: processed, footnotes };
}

export default function ReadingPreview({ editor, work }: ReadingPreviewProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const entries = useBibliography(work.id);

  const entriesById = useMemo(() => {
    const map = new Map<number, BibliographyEntry>();
    for (const e of entries ?? []) {
      if (e.id != null) map.set(e.id, e);
    }
    return map;
  }, [entries]);

  const { html, footnotes } = useMemo(() => {
    if (!editor) return { html: "", footnotes: [] };
    const json = editor.getJSON();
    const raw = generateHTML(json, getExportExtensions());
    const withMath = renderMathInHtml(raw);
    return processCitations(withMath, work.citationStyle ?? "apa", entriesById);
  }, [editor, editor?.state.doc, entriesById, work.citationStyle]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: "1px solid #ddd",
        borderTop: "none",
        minHeight: 500,
      }}
    >
      {/* Title and meta */}
      <Box
        sx={{
          maxWidth: 700,
          mx: "auto",
          p: 3,
          position: "relative",
        }}
      >
        <Tooltip title={showMetadata ? "Hide metadata" : "Show metadata"}>
          <IconButton
            size="small"
            onClick={() => setShowMetadata(!showMetadata)}
            sx={{ position: "absolute", top: 8, right: 8, p: 0.5 }}
          >
            {showMetadata ? (
              <VisibilityOffIcon sx={{ fontSize: 18, color: "#666" }} />
            ) : (
              <VisibilityIcon sx={{ fontSize: 18, color: "#666" }} />
            )}
          </IconButton>
        </Tooltip>

        {showMetadata && (
          <>
            <Typography
              component="h1"
              sx={{
                fontFamily: "Georgia, serif",
                fontSize: "1.75em",
                fontWeight: "normal",
                textAlign: "center",
                mb: 1,
                color: "#2a2a2a",
              }}
            >
              {work.title}
            </Typography>

            {work.summary && (
              <Box
                sx={{
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  p: 1.5,
                  mb: 2,
                  fontSize: "0.9em",
                  color: "#555",
                }}
              >
                {work.summary}
              </Box>
            )}

            {(work.subjects.length > 0 || work.topics.length > 0) && (
              <Box
                sx={{
                  fontSize: "0.85em",
                  color: "#666",
                  mb: 2,
                  pb: 1,
                  borderBottom: "1px solid #ddd",
                }}
              >
                {work.subjects.length > 0 && (
                  <Typography sx={{ fontSize: "inherit", mb: 0.25 }}>
                    <strong>Subjects:</strong> {work.subjects.join(", ")}
                  </Typography>
                )}
                {work.topics.length > 0 && (
                  <Typography sx={{ fontSize: "inherit", mb: 0.25 }}>
                    <strong>Topics:</strong> {work.topics.join(", ")}
                  </Typography>
                )}
                {work.keyTerms.length > 0 && (
                  <Typography sx={{ fontSize: "inherit" }}>
                    <strong>Key Terms:</strong> {work.keyTerms.join(", ")}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}

        {/* Content */}
        <Box
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1em",
            lineHeight: 1.8,
            color: "#2a2a2a",
            "& h1": {
              fontSize: "1.75em",
              fontWeight: "normal",
              textAlign: "center",
              fontFamily: "Georgia, serif",
            },
            "& h2": {
              fontSize: "1.5em",
              fontWeight: "normal",
              borderBottom: "1px solid #ddd",
              pb: 0.5,
              fontFamily: "Georgia, serif",
            },
            "& h3": {
              fontSize: "1.286em",
              fontWeight: "normal",
              fontFamily: "Georgia, serif",
            },
            "& h4": {
              fontSize: "1.145em",
              fontWeight: "normal",
              fontFamily: "Georgia, serif",
            },
            "& p": { mb: 1.5 },
            "& blockquote": {
              borderLeft: "3px solid #ddd",
              pl: 2,
              ml: 0,
              color: "#555",
              fontStyle: "italic",
            },
            "& pre": {
              backgroundColor: "#f5f5f5",
              p: 2,
              borderRadius: "4px",
              overflow: "auto",
              fontFamily: "'Monaco', 'Consolas', Courier, monospace",
              fontSize: "0.9em",
            },
            "& code": {
              backgroundColor: "#f5f5f5",
              px: 0.5,
              borderRadius: "2px",
              fontFamily: "'Monaco', 'Consolas', Courier, monospace",
              fontSize: "0.9em",
            },
            "& table": {
              borderCollapse: "collapse",
              width: "100%",
              mb: 2,
            },
            "& th, & td": { border: "1px solid #ddd", p: 1 },
            "& th": { backgroundColor: "#f5f5f5", fontWeight: "bold" },
            "& img": { maxWidth: "100%" },
            "& hr": {
              border: "none",
              borderTop: "1px solid #ddd",
              my: 3,
            },
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* OSCOLA footnotes section */}
        {footnotes.length > 0 && (
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: "1px solid #ddd",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.85em",
                fontWeight: "bold",
                mb: 1,
                fontFamily: "Georgia, serif",
              }}
            >
              Footnotes
            </Typography>
            <Box
              component="ol"
              sx={{
                pl: 2.5,
                m: 0,
                fontSize: "0.8em",
                lineHeight: 1.6,
                color: "#444",
                "& li": { mb: 0.5 },
              }}
            >
              {footnotes.map((fn, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: fn }} />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
