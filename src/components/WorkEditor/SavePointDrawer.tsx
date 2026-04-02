import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSavePoints, deleteSavePoint, updateChapter, recalcWorkWordCount } from "../../db/useWorks";
import type { Chapter, SavePoint } from "../../types";

interface SavePointDrawerProps {
  workId: number;
  chapters: Chapter[];
  activeChapterId: number | null;
  onRestore: (content: string) => void;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function contentPreview(content: string): string {
  try {
    const doc = JSON.parse(content);
    const texts: string[] = [];
    const walk = (node: { type?: string; text?: string; content?: unknown[] }) => {
      if (node.text) texts.push(node.text);
      if (node.content) (node.content as typeof node[]).forEach(walk);
    };
    walk(doc);
    const full = texts.join(" ");
    return full.length > 300 ? full.slice(0, 300) + "..." : full;
  } catch {
    return "(unable to preview)";
  }
}

export default function SavePointDrawer({
  workId,
  chapters,
  activeChapterId,
  onRestore,
}: SavePointDrawerProps) {
  const savePoints = useSavePoints(workId);
  const [filter, setFilter] = useState<"all" | "current">("current");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  const chapterMap = useMemo(() => {
    const m = new Map<number, string>();
    chapters.forEach((ch) => {
      if (ch.id != null) m.set(ch.id, ch.title || `Chapter ${ch.order}`);
    });
    return m;
  }, [chapters]);

  const filtered = useMemo(() => {
    if (!savePoints) return undefined;
    if (filter === "current" && activeChapterId) {
      return savePoints.filter((sp) => sp.chapterId === activeChapterId);
    }
    return savePoints;
  }, [savePoints, filter, activeChapterId]);

  const handleRestore = async (sp: SavePoint) => {
    if (confirming !== sp.id) {
      setConfirming(sp.id!);
      return;
    }
    // Actually restore
    onRestore(sp.content);
    // Also persist to DB
    if (sp.chapterId) {
      const parsed = JSON.parse(sp.content);
      const text = extractText(parsed);
      const wc = countWords(text);
      await updateChapter(sp.chapterId, { content: sp.content, wordCount: wc });
      await recalcWorkWordCount(workId);
    }
    setConfirming(null);
  };

  const handleDelete = async (id: number) => {
    await deleteSavePoint(id);
  };

  if (!savePoints) {
    return (
      <Typography sx={{ fontSize: "0.85rem", color: "#666", p: 1 }}>
        Loading...
      </Typography>
    );
  }

  return (
    <Box>
      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
        <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>Show:</Typography>
        <Chip
          label="Current chapter"
          size="small"
          onClick={() => setFilter("current")}
          sx={{
            fontSize: "0.75rem",
            height: 24,
            backgroundColor: filter === "current" ? "#900" : "#eee",
            color: filter === "current" ? "#fff" : "#666",
            "&:hover": {
              backgroundColor: filter === "current" ? "#700" : "#ddd",
            },
          }}
        />
        <Chip
          label="All chapters"
          size="small"
          onClick={() => setFilter("all")}
          sx={{
            fontSize: "0.75rem",
            height: 24,
            backgroundColor: filter === "all" ? "#900" : "#eee",
            color: filter === "all" ? "#fff" : "#666",
            "&:hover": {
              backgroundColor: filter === "all" ? "#700" : "#ddd",
            },
          }}
        />
        <Typography sx={{ fontSize: "0.75rem", color: "#999", ml: "auto" }}>
          {filtered?.length ?? 0} save point{(filtered?.length ?? 0) !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Save point list */}
      {filtered && filtered.length === 0 && (
        <Typography sx={{ fontSize: "0.85rem", color: "#999", textAlign: "center", py: 3 }}>
          No save points yet. Use the save icon (Ctrl+Shift+S) to create one.
        </Typography>
      )}

      {filtered?.map((sp) => {
        const isExpanded = expandedId === sp.id;
        const chapterName = sp.chapterId ? chapterMap.get(sp.chapterId) ?? `Chapter #${sp.chapterId}` : "Whole work";

        return (
          <Box
            key={sp.id}
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "0.25em",
              mb: 0.75,
              backgroundColor: isExpanded ? "#fafafa" : "#fff",
              "&:hover": { borderColor: "#ccc" },
            }}
          >
            {/* Header row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1.25,
                py: 0.75,
                cursor: "pointer",
                gap: 1,
              }}
              onClick={() => setExpandedId(isExpanded ? null : sp.id!)}
            >
              {isExpanded ? (
                <ExpandLessIcon sx={{ fontSize: 16, color: "#999" }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16, color: "#999" }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: sp.name ? "bold" : "normal",
                      color: "#2a2a2a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sp.name || "Manual save"}
                  </Typography>
                  {filter === "all" && (
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "#999",
                        flexShrink: 0,
                      }}
                    >
                      {chapterName}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#999",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(sp.createdAt)}
              </Typography>
            </Box>

            {/* Expanded detail */}
            {isExpanded && (
              <Box
                sx={{
                  px: 1.25,
                  pb: 1,
                  borderTop: "1px solid #eee",
                }}
              >
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    backgroundColor: "#fff",
                    border: "1px solid #eee",
                    borderRadius: "0.25em",
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      color: "#555",
                      lineHeight: 1.6,
                      fontFamily: "Georgia, serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {contentPreview(sp.content)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mt: 1, justifyContent: "flex-end", alignItems: "center" }}>
                  {sp.chapterId && (
                    <>
                      {confirming === sp.id && (
                        <Typography sx={{ fontSize: "0.75rem", color: "#900", mr: "auto" }}>
                          This will replace the current chapter content. Click again to confirm.
                        </Typography>
                      )}
                      <Tooltip title="Restore this save point">
                        <Button
                          size="small"
                          startIcon={<RestoreIcon sx={{ fontSize: 14 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(sp);
                          }}
                          sx={{
                            fontSize: "0.75rem",
                            textTransform: "none",
                            color: confirming === sp.id ? "#fff" : "#900",
                            backgroundColor: confirming === sp.id ? "#900" : "transparent",
                            border: "1px solid #900",
                            px: 1,
                            py: 0.25,
                            "&:hover": {
                              backgroundColor: confirming === sp.id ? "#700" : "rgba(153,0,0,0.05)",
                            },
                          }}
                        >
                          {confirming === sp.id ? "Confirm Restore" : "Restore"}
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Delete save point">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sp.id!);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16, color: "#999" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function extractText(node: { text?: string; content?: unknown[] }): string {
  const parts: string[] = [];
  if (node.text) parts.push(node.text);
  if (node.content) {
    (node.content as typeof node[]).forEach((child) => {
      parts.push(extractText(child));
    });
  }
  return parts.join(" ");
}
