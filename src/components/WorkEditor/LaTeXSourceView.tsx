import { useMemo, useRef, useEffect, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { Editor } from "@tiptap/react";
import { tiptapJsonToLatex } from "../../utils/toLatex";
import { generateHTML } from "@tiptap/html";
import { getExportExtensions } from "../../extensions";
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { syntaxHighlighting, defaultHighlightStyle, StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";

interface LaTeXSourceViewProps {
  editor: Editor | null;
}

export default function LaTeXSourceView({ editor }: LaTeXSourceViewProps) {
  const cmContainer = useRef<HTMLDivElement>(null);
  const cmView = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);

  const latex = useMemo(() => {
    if (!editor) return "";
    return tiptapJsonToLatex(editor.getJSON());
  }, [editor, editor?.state.doc]);

  const previewHtml = useMemo(() => {
    if (!editor) return "";
    try {
      return generateHTML(editor.getJSON(), getExportExtensions());
    } catch {
      return "<p>Preview unavailable</p>";
    }
  }, [editor, editor?.state.doc]);

  useEffect(() => {
    if (!cmContainer.current) return;

    // Destroy previous instance
    if (cmView.current) {
      cmView.current.destroy();
      cmView.current = null;
    }

    const state = EditorState.create({
      doc: latex,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        StreamLanguage.define(stex),
        EditorView.editable.of(false),
        EditorView.theme({
          "&": {
            fontSize: "0.85rem",
            fontFamily: "'Monaco', 'Consolas', Courier, monospace",
          },
          "&.cm-focused": { outline: "none" },
          ".cm-gutters": {
            backgroundColor: "#f9f9f9",
            borderRight: "1px solid #ddd",
          },
        }),
      ],
    });

    cmView.current = new EditorView({
      state,
      parent: cmContainer.current,
    });

    return () => {
      cmView.current?.destroy();
      cmView.current = null;
    };
  }, [latex]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: "1px solid #ddd",
        borderTop: "none",
        minHeight: 500,
        display: "flex",
      }}
    >
      {/* Left: LaTeX source */}
      <Box
        sx={{
          flex: 1,
          borderRight: "1px solid #ddd",
          position: "relative",
          overflow: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 1,
            py: 0.25,
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
            LaTeX Source (read-only)
          </Typography>
          <Tooltip title={copied ? "Copied!" : "Copy LaTeX"}>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
              <ContentCopyIcon sx={{ fontSize: 14, color: "#666" }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box ref={cmContainer} sx={{ minHeight: 470 }} />
      </Box>

      {/* Right: Rendered preview */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          maxHeight: "80vh",
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 0.25,
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
            Preview
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            fontFamily: "Georgia, serif",
            fontSize: "0.9em",
            lineHeight: 1.8,
            color: "#2a2a2a",
            "& h1, & h2, & h3, & h4": {
              fontFamily: "Georgia, serif",
              fontWeight: "normal",
            },
            "& h1": { fontSize: "1.5em" },
            "& h2": { fontSize: "1.3em" },
            "& h3": { fontSize: "1.15em" },
            "& blockquote": {
              borderLeft: "3px solid #ddd",
              pl: 1.5,
              ml: 0,
              color: "#555",
            },
            "& pre": {
              backgroundColor: "#f5f5f5",
              p: 1,
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "0.85em",
            },
            "& table": { borderCollapse: "collapse", width: "100%" },
            "& th, & td": {
              border: "1px solid #ddd",
              p: 0.5,
              fontSize: "0.85em",
            },
            "& img": { maxWidth: "100%" },
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Box>
    </Box>
  );
}
