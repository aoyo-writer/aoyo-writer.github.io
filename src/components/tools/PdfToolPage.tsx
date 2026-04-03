import { useState, useRef, useCallback } from "react";
import { Box, Typography, Button, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  loadPdf,
  renderPageThumbnail,
  mergePdfs,
  type PdfSource,
  type PageItem,
} from "../../utils/pdfTools";

const ao3ButtonSx = {
  background: "linear-gradient(#fff 2%, #ddd 95%, #bbb 100%)",
  border: "1px solid #bbb",
  color: "#2a2a2a",
  fontSize: "0.85rem",
  textTransform: "none" as const,
  p: "0.25em 0.75em",
  borderRadius: "0.25em",
  "&:hover": {
    background: "linear-gradient(#fff 2%, #ccc 95%, #aaa 100%)",
  },
};

const SOURCE_COLORS = ["#900", "#069", "#360", "#930", "#609", "#066", "#906", "#096"];

let pageIdCounter = 0;

export default function PdfToolPage() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const [sources, setSources] = useState<PdfSource[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const newSources: PdfSource[] = [];
      const newPages: PageItem[] = [];

      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") continue;
        const source = await loadPdf(file);
        const sourceIndex = sources.length + newSources.length;
        newSources.push(source);

        for (let i = 0; i < source.pageCount; i++) {
          const thumbnail = await renderPageThumbnail(source.bytes, i);
          newPages.push({
            id: `page-${++pageIdCounter}`,
            sourceIndex,
            pageIndex: i,
            thumbnail,
          });
        }
      }

      setSources((prev) => [...prev, ...newSources]);
      setPages((prev) => [...prev, ...newPages]);
    } catch (err) {
      alert(`Failed to load PDF: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [sources.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDeletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    setSources([]);
    setPages([]);
  };

  const handleMergeDownload = async () => {
    if (pages.length === 0) return;
    setMerging(true);
    try {
      const pageOrder = pages.map((p) => ({
        sourceIndex: p.sourceIndex,
        pageIndex: p.pageIndex,
      }));
      const merged = await mergePdfs(sources, pageOrder);
      const blob = new Blob([merged as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Merge failed: ${err}`);
    } finally {
      setMerging(false);
    }
  };

  // Drag-and-drop reorder
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    setPages((prev) => {
      const copy = [...prev];
      const [dragged] = copy.splice(dragItem.current!, 1);
      copy.splice(dragOver.current!, 0, dragged);
      return copy;
    });
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <Box
      sx={{
        maxWidth: 980,
        mx: "auto",
        px: isMobile ? 1 : "3em",
        py: "1em",
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontFamily: "Georgia, serif",
          fontSize: "1.5em",
          fontWeight: "normal",
          mb: 2,
          borderBottom: "1px solid #ddd",
          pb: 0.5,
        }}
      >
        PDF Tool
      </Typography>

      {/* Upload area */}
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: "2px dashed #ccc",
          borderRadius: "0.5em",
          p: 3,
          textAlign: "center",
          mb: 2,
          backgroundColor: "#fafafa",
          cursor: "pointer",
          transition: "border-color 0.2s",
          "&:hover": { borderColor: "#900" },
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".pdf";
          input.multiple = true;
          input.onchange = (e) =>
            handleFileUpload((e.target as HTMLInputElement).files);
          input.click();
        }}
      >
        <UploadFileIcon sx={{ fontSize: 40, color: "#999", mb: 1 }} />
        <Typography sx={{ fontSize: "0.9rem", color: "#666" }}>
          {loading
            ? "Loading PDF pages..."
            : "Drop PDF files here or click to upload"}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "#999", mt: 0.5 }}>
          Upload multiple PDFs to merge, rearrange, or remove pages
        </Typography>
      </Box>

      {/* Actions bar */}
      {pages.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 2,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleMergeDownload}
              disabled={merging || pages.length === 0}
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              sx={ao3ButtonSx}
            >
              {merging ? "Merging..." : `Merge & Download (${pages.length} pages)`}
            </Button>
          </Box>
          <Button
            onClick={handleClearAll}
            startIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
            sx={{ ...ao3ButtonSx, color: "#900" }}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Source legend */}
      {sources.length > 1 && (
        <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
          {sources.map((s, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "2px",
                  backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length],
                }}
              />
              <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
                {s.name} ({s.pageCount}p)
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Page grid */}
      {pages.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {pages.map((page, index) => (
            <Box
              key={page.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                width: 130,
                border: `2px solid ${SOURCE_COLORS[page.sourceIndex % SOURCE_COLORS.length]}`,
                borderRadius: "4px",
                overflow: "hidden",
                cursor: "grab",
                position: "relative",
                backgroundColor: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
                "&:active": { cursor: "grabbing" },
              }}
            >
              <img
                src={page.thumbnail}
                alt={`Page ${page.pageIndex + 1}`}
                style={{ width: "100%", display: "block" }}
                draggable={false}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 0.5,
                  py: 0.25,
                  backgroundColor: "#f5f5f5",
                  borderTop: "1px solid #eee",
                }}
              >
                <Typography sx={{ fontSize: "0.65rem", color: "#666" }}>
                  {sources[page.sourceIndex]?.name.slice(0, 10)}
                  {(sources[page.sourceIndex]?.name.length ?? 0) > 10 ? "..." : ""}{" "}
                  p{page.pageIndex + 1}
                </Typography>
                <Tooltip title="Remove page">
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePage(page.id)}
                    sx={{ p: 0.125 }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 14, color: "#999" }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {pages.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography sx={{ fontSize: "0.9rem", color: "#999" }}>
            No pages loaded. Upload PDF files to get started.
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#bbb", mt: 1 }}>
            Tip: You can export a work as PDF (from the editor) and then
            re-upload it here to splice with other documents.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
