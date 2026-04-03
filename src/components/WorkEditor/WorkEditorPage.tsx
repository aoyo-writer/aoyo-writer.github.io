import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Box, Typography, Button, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { useParams, Link } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { getEditorExtensions } from "../../extensions";
import SaveIcon from "@mui/icons-material/Save";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DownloadIcon from "@mui/icons-material/Download";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HistoryIcon from "@mui/icons-material/History";
import {
  useWork,
  useChapters,
  touchWork,
  updateChapter,
  recalcWorkWordCount,
  createSavePoint,
  createChapter,
} from "../../db/useWorks";
import type { Chapter } from "../../types";
import { isOverWordLimit } from "../../types";
import { exportAsMarkdown, exportAsHtml, exportAsDocx, exportAsPdf, downloadFile, downloadBlob } from "../../utils/export";
import DescriptionIcon from "@mui/icons-material/Description";
import HtmlIcon from "@mui/icons-material/Html";
import ArticleIcon from "@mui/icons-material/Article";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { importDocx } from "../../utils/importDocx";
import {
  CitationStyleContext,
  FootnoteMapContext,
} from "../../hooks/useCitationStyle";
import type { FootnoteInfo } from "../../hooks/useCitationStyle";
import EditorToolbar from "./EditorToolbar";
import ReadingPreview from "./ReadingPreview";
import LaTeXSourceView from "./LaTeXSourceView";
import BottomDrawer from "./BottomDrawer";
import BibliographyDrawer from "./BibliographyDrawer";
import SavePointDrawer from "./SavePointDrawer";
import CitationPickerDialog from "./CitationPickerDialog";
import SourceRefDialog from "./SourceRefDialog";

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export default function WorkEditorPage() {
  const { id } = useParams<{ id: string }>();
  const workId = id ? parseInt(id) : undefined;
  const work = useWork(workId);
  const chapters = useChapters(workId);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "latex" | "preview">("edit");
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [drawerOpen, setDrawerOpen] = useState<"bibliography" | "savepoints" | null>(null);
  const [citationPickerOpen, setCitationPickerOpen] = useState(false);
  const [sourceRefOpen, setSourceRefOpen] = useState(false);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const [pinnedPdf, setPinnedPdf] = useState<{ url: string; filename: string } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  // Flush any pending debounced save immediately
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const ed = editorRef.current;
    if (ed && !ed.isDestroyed) {
      const json = JSON.stringify(ed.getJSON());
      const wc = countWords(ed.getText());
      if (activeChapterId && workId) {
        updateChapter(activeChapterId, { content: json, wordCount: wc });
        recalcWorkWordCount(workId);
      }
    }
  }, [activeChapterId, workId]);

  // Set active chapter when chapters load
  useEffect(() => {
    if (chapters && chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(chapters[0].id!);
    }
  }, [chapters, activeChapterId]);

  // Touch work on open
  useEffect(() => {
    if (workId) touchWork(workId);
  }, [workId]);

  // Listen for citation picker keyboard shortcut
  useEffect(() => {
    const handler = () => setCitationPickerOpen(true);
    document.addEventListener("open-citation-picker", handler);
    return () => document.removeEventListener("open-citation-picker", handler);
  }, []);

  // Listen for source ref picker keyboard shortcut
  useEffect(() => {
    const handler = () => setSourceRefOpen(true);
    document.addEventListener("open-source-ref-picker", handler);
    return () => document.removeEventListener("open-source-ref-picker", handler);
  }, []);

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveStatus]);

  // Flush pending save on unmount (navigation away from editor)
  useEffect(() => {
    return () => flushSave();
  }, [flushSave]);

  const activeChapter = chapters?.find(
    (ch: Chapter) => ch.id === activeChapterId,
  );

  const handleSave = useCallback(
    async (content: string, wc: number) => {
      if (!activeChapterId || !workId) return;
      setSaveStatus("saving");
      await updateChapter(activeChapterId, {
        content,
        wordCount: wc,
      });
      await recalcWorkWordCount(workId);
      setSaveStatus("saved");
    },
    [activeChapterId, workId],
  );

  const editor = useEditor(
    {
      extensions: getEditorExtensions(),
      content: activeChapter
        ? JSON.parse(activeChapter.content)
        : { type: "doc", content: [{ type: "paragraph" }] },
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
      },
      onUpdate: ({ editor: ed }) => {
        setSaveStatus("unsaved");
        // Debounced autosave
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const json = JSON.stringify(ed.getJSON());
          const wc = countWords(ed.getText());
          handleSave(json, wc);
        }, 1500);
      },
      onBeforeCreate: () => {
        // Flush pending save from previous chapter before editor re-creates
        flushSave();
      },
    },
    [activeChapterId],
  );

  // Compute footnote map for OSCOLA citations
  const footnoteMap = useMemo(() => {
    const map = new Map<number, FootnoteInfo>();
    if (!editor) return map;
    const seenEntryIds = new Set<number>();
    let index = 1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "citation") {
        const entryId = node.attrs.entryId as number | null;
        const isFirst = entryId != null && !seenEntryIds.has(entryId);
        if (entryId != null) seenEntryIds.add(entryId);
        map.set(pos, { index, isFirst });
        index++;
      }
    });
    return map;
  }, [editor, editor?.state.doc]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!editor || !activeChapterId || !workId) return;
    const json = JSON.stringify(editor.getJSON());
    const wc = countWords(editor.getText());
    await handleSave(json, wc);
    const name = window.prompt("Save point name (optional):", "") ?? null;
    await createSavePoint(workId, activeChapterId, json, name || null);
  }, [editor, activeChapterId, workId, handleSave]);

  // Ctrl+Shift+S keyboard shortcut for manual save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleManualSave]);

  // Export
  const handleExport = async (format: "md" | "html" | "docx" | "pdf") => {
    if (!work) return;
    setExportAnchor(null);
    const slug = work.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    if (format === "md") {
      const md = await exportAsMarkdown(work);
      downloadFile(md, `${slug}.md`, "text/markdown");
    } else if (format === "html") {
      const html = await exportAsHtml(work);
      downloadFile(html, `${slug}.html`, "text/html");
    } else if (format === "docx") {
      const blob = await exportAsDocx(work);
      downloadBlob(blob, `${slug}.docx`);
    } else if (format === "pdf") {
      await exportAsPdf(work);
    }
  };

  const handleDocxImport = () => {
    if (!editor || !activeChapterId) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!window.confirm("Replace current chapter content with imported document?")) return;
      try {
        const { json } = await importDocx(file);
        editor.commands.setContent(json);
      } catch (err) {
        alert(`Import failed: ${err}`);
      }
    };
    input.click();
    setExportAnchor(null);
  };

  // Add chapter
  const handleAddChapter = async () => {
    if (!workId || !chapters) return;
    const order = chapters.length + 1;
    const newId = await createChapter(workId, `Chapter ${order}`, order);
    setActiveChapterId(newId);
  };

  if (!work) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", px: "3em", py: "1em" }}>
        <Typography sx={{ color: "#666" }}>Loading...</Typography>
      </Box>
    );
  }

  const overLimit = isOverWordLimit(work);
  const citationStyle = work.citationStyle ?? "apa";

  return (
    <CitationStyleContext.Provider value={citationStyle}>
    <FootnoteMapContext.Provider value={footnoteMap}>
    <Box
      sx={{
        maxWidth: 980,
        mx: "auto",
        px: { xs: 0.5, sm: 2 },
        py: "0.5em",
      }}
    >
      {/* Title bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
          px: 0.5,
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1.3em",
            fontWeight: "normal",
            color: "#2a2a2a",
          }}
        >
          {work.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              color:
                saveStatus === "unsaved"
                  ? "#d6ab00"
                  : saveStatus === "saving"
                    ? "#666"
                    : "#77a801",
            }}
          >
            {saveStatus === "unsaved"
              ? "Unsaved"
              : saveStatus === "saving"
                ? "Saving..."
                : "Saved"}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: overLimit ? "#900" : "#666",
                fontWeight: overLimit ? "bold" : "normal",
                lineHeight: 1,
              }}
            >
              {work.wordCount.toLocaleString()} words
              {work.wordCountLimit
                ? ` / ${work.wordCountLimit.toLocaleString()}`
                : ""}
              {work.wordCountLimit && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.7rem",
                    ml: 0.5,
                    color: overLimit ? "#900" : "#999",
                  }}
                >
                  {overLimit
                    ? `(${(work.wordCount - work.wordCountLimit).toLocaleString()} over)`
                    : `(${(work.wordCountLimit - work.wordCount).toLocaleString()} remaining)`}
                </Typography>
              )}
            </Typography>
            {work.wordCountLimit && (
              <Box
                sx={{
                  width: 80,
                  height: 3,
                  backgroundColor: "#eee",
                  borderRadius: 1.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min((work.wordCount / work.wordCountLimit) * 100, 100)}%`,
                    height: "100%",
                    backgroundColor:
                      work.wordCount > work.wordCountLimit
                        ? "#900"
                        : work.wordCount > work.wordCountLimit * 0.8
                          ? "#d6ab00"
                          : "#77a801",
                    transition: "width 0.3s, background-color 0.3s",
                  }}
                />
              </Box>
            )}
          </Box>
          <Tooltip title="Save Version (Ctrl+Shift+S)">
            <IconButton size="small" onClick={handleManualSave} sx={{ p: 0.5 }}>
              <SaveIcon sx={{ fontSize: 18, color: "#666" }} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={toolbarCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}
          >
            <IconButton
              size="small"
              onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
              sx={{ p: 0.5 }}
            >
              {toolbarCollapsed ? (
                <UnfoldMoreIcon sx={{ fontSize: 18, color: "#666" }} />
              ) : (
                <UnfoldLessIcon sx={{ fontSize: 18, color: "#666" }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Bibliography">
            <IconButton
              size="small"
              onClick={() =>
                setDrawerOpen(
                  drawerOpen === "bibliography" ? null : "bibliography",
                )
              }
              sx={{ p: 0.5 }}
            >
              <MenuBookIcon
                sx={{
                  fontSize: 18,
                  color: drawerOpen === "bibliography" ? "#900" : "#666",
                }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save Point History">
            <IconButton
              size="small"
              onClick={() =>
                setDrawerOpen(
                  drawerOpen === "savepoints" ? null : "savepoints",
                )
              }
              sx={{ p: 0.5 }}
            >
              <HistoryIcon
                sx={{
                  fontSize: 18,
                  color: drawerOpen === "savepoints" ? "#900" : "#666",
                }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton
              size="small"
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{ p: 0.5 }}
            >
              <DownloadIcon sx={{ fontSize: 18, color: "#666" }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 160,
                  "& .MuiMenuItem-root": { fontSize: "0.85rem" },
                },
              },
            }}
          >
            <MenuItem onClick={() => handleExport("md")}>
              <ListItemIcon><DescriptionIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText>Markdown (.md)</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport("html")}>
              <ListItemIcon><HtmlIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText>HTML (.html)</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport("docx")}>
              <ListItemIcon><ArticleIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText>Word (.docx)</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport("pdf")}>
              <ListItemIcon><PictureAsPdfIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText>PDF (print)</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDocxImport}>
              <ListItemIcon><UploadFileIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText>Import .docx</ListItemText>
            </MenuItem>
          </Menu>
          <Link
            to={`/work/${work.id}/settings`}
            style={{
              color: "#900",
              textDecoration: "none",
              fontSize: "0.8rem",
            }}
          >
            Settings
          </Link>
        </Box>
      </Box>

      {/* Chapter tabs */}
      {work.chapterMode === "chaptered" && chapters && (
        <Box
          sx={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid #ddd",
            mb: 0,
            flexWrap: "wrap",
          }}
        >
          {chapters.map((ch: Chapter) => (
            <Button
              key={ch.id}
              size="small"
              onClick={() => { flushSave(); setActiveChapterId(ch.id!); }}
              sx={{
                fontSize: "0.8rem",
                textTransform: "none",
                color: ch.id === activeChapterId ? "#2a2a2a" : "#900",
                fontWeight: ch.id === activeChapterId ? "bold" : "normal",
                borderBottom:
                  ch.id === activeChapterId
                    ? "2px solid #900"
                    : "2px solid transparent",
                borderRadius: 0,
                minWidth: "auto",
                px: 1.5,
                py: 0.5,
              }}
            >
              {ch.title || `Ch. ${ch.order}`}
            </Button>
          ))}
          <Button
            size="small"
            onClick={handleAddChapter}
            sx={{
              fontSize: "0.8rem",
              textTransform: "none",
              color: "#666",
              minWidth: "auto",
              px: 1,
            }}
          >
            +
          </Button>
        </Box>
      )}

      {/* View mode tabs */}
      <Box
        sx={{
          display: "flex",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        {(["edit", "latex", "preview"] as const).map((tab) => (
          <Button
            key={tab}
            size="small"
            onClick={() => setActiveTab(tab)}
            sx={{
              fontSize: "0.85rem",
              textTransform: "none",
              color: tab === activeTab ? "#2a2a2a" : "#900",
              fontWeight: tab === activeTab ? "bold" : "normal",
              borderBottom:
                tab === activeTab
                  ? "2px solid #900"
                  : "2px solid transparent",
              borderRadius: 0,
              px: 2,
              py: 0.75,
            }}
          >
            {tab === "edit" ? "Edit" : tab === "latex" ? "LaTeX" : "Preview"}
          </Button>
        ))}
      </Box>

      {/* Toolbar - only in edit mode */}
      {activeTab === "edit" && (
        <EditorToolbar editor={editor} collapsed={toolbarCollapsed} />
      )}

      {/* Content area: editor/preview + optional pinned PDF side panel */}
      <Box sx={{ display: "flex", gap: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>

      {/* Editor - stays mounted but hidden when not in edit tab */}
      <Box
        sx={{
          display: activeTab === "edit" ? "block" : "none",
          border: "1px solid #ddd",
          borderTop: activeTab === "edit" ? "none" : "1px solid #ddd",
          minHeight: 500,
          "& .tiptap": {
            outline: "none",
            p: 2,
            fontFamily: "Georgia, serif",
            fontSize: "1em",
            lineHeight: 1.8,
            color: "#2a2a2a",
            minHeight: 500,
          },
          "& .tiptap p": { mb: 1 },
          "& .tiptap h1, & .tiptap h2, & .tiptap h3, & .tiptap h4": {
            fontFamily: "Georgia, serif",
            fontWeight: "normal",
            mt: 2,
            mb: 1,
          },
          "& .tiptap h1": { fontSize: "1.75em" },
          "& .tiptap h2": { fontSize: "1.5em" },
          "& .tiptap h3": { fontSize: "1.286em" },
          "& .tiptap h4": { fontSize: "1.145em" },
          "& .tiptap blockquote": {
            borderLeft: "3px solid #ddd",
            pl: 2,
            ml: 0,
            color: "#555",
          },
          "& .tiptap pre": {
            backgroundColor: "#f5f5f5",
            borderRadius: "0.25em",
            p: 1.5,
            fontFamily: "'Monaco', 'Consolas', Courier, monospace",
            fontSize: "0.9em",
          },
          "& .tiptap code": {
            backgroundColor: "#f5f5f5",
            borderRadius: "0.15em",
            px: 0.5,
            fontFamily: "'Monaco', 'Consolas', Courier, monospace",
            fontSize: "0.9em",
          },
          "& .tiptap table": {
            borderCollapse: "collapse",
            width: "100%",
            mb: 1,
          },
          "& .tiptap th, & .tiptap td": {
            border: "1px solid #ddd",
            p: 0.75,
            fontSize: "0.9em",
          },
          "& .tiptap th": {
            backgroundColor: "#f5f5f5",
            fontWeight: "bold",
          },
          "& .tiptap img": {
            maxWidth: "100%",
            height: "auto",
          },
          "& .tiptap ul[data-type='taskList']": {
            listStyle: "none",
            pl: 0,
          },
          "& .tiptap p.is-editor-empty:first-child::before": {
            content: "attr(data-placeholder)",
            float: "left",
            color: "#aaa",
            pointerEvents: "none",
            height: 0,
            fontStyle: "italic",
          },
          "& .tiptap hr": {
            border: "none",
            borderTop: "1px solid #ddd",
            my: 2,
          },
          "& .tiptap mark.source-ref": {
            backgroundColor: "#fff3cd",
            borderBottom: "2px dotted #d4a800",
            cursor: "help",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* Preview tab */}
      {activeTab === "preview" && (
        <ReadingPreview editor={editor} work={work} />
      )}

      {/* LaTeX tab */}
      {activeTab === "latex" && (
        <LaTeXSourceView editor={editor} />
      )}

      </Box>{/* end content column */}

      {/* Pinned PDF side panel */}
      {pinnedPdf && (
        <Box
          sx={{
            width: "40%",
            minWidth: 300,
            maxWidth: 500,
            borderLeft: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1,
              py: 0.5,
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pinnedPdf.filename}
            </Typography>
            <Button
              size="small"
              onClick={() => {
                URL.revokeObjectURL(pinnedPdf.url);
                setPinnedPdf(null);
              }}
              sx={{
                fontSize: "0.7rem",
                textTransform: "none",
                color: "#900",
                minWidth: "auto",
                p: "0 4px",
              }}
            >
              Close
            </Button>
          </Box>
          <Box
            component="iframe"
            src={pinnedPdf.url}
            sx={{
              flex: 1,
              border: "none",
              minHeight: 500,
            }}
          />
        </Box>
      )}
      </Box>{/* end flex wrapper */}

      {/* Bottom drawer */}
      <BottomDrawer
        open={drawerOpen === "bibliography"}
        title="Bibliography"
        onClose={() => setDrawerOpen(null)}
        fullPageUrl={`/tools/research?work=${workId}`}
      >
        <BibliographyDrawer
          workId={workId!}
          editor={editor}
          onPinPdf={(url, filename) => setPinnedPdf({ url, filename })}
        />
      </BottomDrawer>

      <BottomDrawer
        open={drawerOpen === "savepoints"}
        title="Save Point History"
        onClose={() => setDrawerOpen(null)}
      >
        {workId && chapters && (
          <SavePointDrawer
            workId={workId}
            chapters={chapters}
            activeChapterId={activeChapterId}
            onRestore={(content) => {
              if (editor) {
                editor.commands.setContent(JSON.parse(content));
              }
            }}
          />
        )}
      </BottomDrawer>

      {/* Citation picker dialog */}
      {workId && (
        <CitationPickerDialog
          open={citationPickerOpen}
          onClose={() => setCitationPickerOpen(false)}
          workId={workId}
          editor={editor}
        />
      )}

      {/* Source reference dialog */}
      {workId && (
        <SourceRefDialog
          open={sourceRefOpen}
          onClose={() => setSourceRefOpen(false)}
          workId={workId}
          editor={editor}
        />
      )}
    </Box>
    </FootnoteMapContext.Provider>
    </CitationStyleContext.Provider>
  );
}
