import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import type { Editor } from "@tiptap/react";
import type { BibliographyEntry } from "../../types";
import { useBibliography } from "../../db/useWorks";
import { formatBibliographyEntry } from "../../utils/citationFormatter";
import { useCitationStyle } from "../../hooks/useCitationStyle";

interface CitationPickerDialogProps {
  open: boolean;
  onClose: () => void;
  workId: number;
  editor: Editor | null;
}

export default function CitationPickerDialog({
  open,
  onClose,
  workId,
  editor,
}: CitationPickerDialogProps) {
  const citationStyle = useCitationStyle();
  const [search, setSearch] = useState("");
  const entries = useBibliography(workId);

  const filtered = (entries ?? []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.authors.toLowerCase().includes(q) ||
      e.citeKey.toLowerCase().includes(q)
    );
  });

  const insertCitation = (entry: BibliographyEntry) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "citation",
        attrs: { citeKey: entry.citeKey, entryId: entry.id },
      })
      .run();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "0.25em",
            maxHeight: 400,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "Georgia, serif",
          fontSize: "1.1em",
          fontWeight: "normal",
          py: 1,
          px: 2,
          borderBottom: "1px solid #ddd",
        }}
      >
        Insert Citation
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by author, title, or key..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          sx={{
            mb: 1.5,
            "& .MuiOutlinedInput-root": {
              fontSize: "0.85rem",
              borderRadius: "0.25em",
            },
          }}
        />

        {filtered.length === 0 && (
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: "#999",
              textAlign: "center",
              py: 2,
            }}
          >
            {(entries ?? []).length === 0
              ? "No bibliography entries for this work. Add entries via the bibliography drawer."
              : "No entries match your search."}
          </Typography>
        )}

        {filtered.map((entry) => (
          <Box
            key={entry.id}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              py: 0.75,
              px: 0.5,
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f9f9f9" },
            }}
            onClick={() => insertCitation(entry)}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: "#900",
                }}
              >
                [{entry.citeKey}]
              </Typography>
              <Typography
                sx={{ fontSize: "0.8rem", color: "#2a2a2a" }}
                dangerouslySetInnerHTML={{ __html: formatBibliographyEntry(entry, citationStyle) }}
              />
            </Box>
            <Tooltip title="Insert">
              <IconButton size="small" sx={{ p: 0.25, flexShrink: 0 }}>
                <AddIcon sx={{ fontSize: 14, color: "#900" }} />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}
