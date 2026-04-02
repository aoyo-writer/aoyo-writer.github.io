import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import type { Editor } from "@tiptap/react";
import { useBibliography } from "../../db/useWorks";
import { formatBibliographyEntry } from "../../utils/citationFormatter";
import { useCitationStyle } from "../../hooks/useCitationStyle";

interface SourceRefDialogProps {
  open: boolean;
  onClose: () => void;
  workId: number;
  editor: Editor | null;
}

export default function SourceRefDialog({
  open,
  onClose,
  workId,
  editor,
}: SourceRefDialogProps) {
  const citationStyle = useCitationStyle();
  const entries = useBibliography(workId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [pageRef, setPageRef] = useState("");

  const filteredEntries = (entries ?? []).filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.authors.toLowerCase().includes(q) ||
      e.citeKey.toLowerCase().includes(q)
    );
  });

  const handleApply = () => {
    if (!editor || !selectedEntryId) return;
    editor.chain().focus().setSourceRef({ entryId: selectedEntryId, pageRef }).run();
    handleClose();
  };

  const handleRemove = () => {
    if (!editor) return;
    editor.chain().focus().unsetSourceRef().run();
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedEntryId(null);
    setPageRef("");
    onClose();
  };

  // Check if selection already has a sourceRef mark
  const existingMark = editor?.getAttributes("sourceRef");
  const hasExisting = existingMark?.entryId != null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "0.25em",
          maxHeight: "70vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Georgia, serif",
          fontSize: "1.1em",
          fontWeight: "normal",
          pb: 1,
        }}
      >
        Source Reference
      </DialogTitle>
      <DialogContent>
        {!editor?.state.selection.empty ? (
          <>
            <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1.5 }}>
              Tag the selected text with a source reference for tracking.
            </Typography>

            {/* Page/location reference */}
            <TextField
              size="small"
              fullWidth
              label="Page / location (optional)"
              placeholder='e.g. "p. 42", "Ch. 3", "para. 5"'
              value={pageRef}
              onChange={(e) => setPageRef(e.target.value)}
              sx={{
                mb: 1.5,
                "& .MuiOutlinedInput-root": { fontSize: "0.85rem" },
                "& .MuiInputLabel-root": { fontSize: "0.85rem" },
              }}
            />

            {/* Search entries */}
            <TextField
              size="small"
              fullWidth
              placeholder="Search bibliography..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.8rem",
                  height: 32,
                },
              }}
            />

            {/* Entry list */}
            <Box sx={{ maxHeight: 250, overflow: "auto" }}>
              {filteredEntries.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "#999", textAlign: "center", py: 2 }}>
                  No bibliography entries found.
                </Typography>
              )}
              {filteredEntries.map((entry) => (
                <Box
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id!)}
                  sx={{
                    py: 0.75,
                    px: 1,
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    backgroundColor: selectedEntryId === entry.id ? "#fff3cd" : "transparent",
                    borderLeft: selectedEntryId === entry.id ? "3px solid #d4a800" : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: selectedEntryId === entry.id ? "#fff3cd" : "#f9f9f9",
                    },
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.75rem", fontWeight: "bold", color: "#900", mb: 0.25 }}
                  >
                    [{entry.citeKey}]
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.7rem", color: "#2a2a2a" }}
                    dangerouslySetInnerHTML={{ __html: formatBibliographyEntry(entry, citationStyle) }}
                  />
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Typography sx={{ fontSize: "0.85rem", color: "#999", py: 2 }}>
            Select some text in the editor first, then use this dialog to tag it with a source reference.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {hasExisting && (
          <Button
            onClick={handleRemove}
            sx={{
              fontSize: "0.8rem",
              textTransform: "none",
              color: "#c00",
              mr: "auto",
            }}
          >
            Remove annotation
          </Button>
        )}
        <Button
          onClick={handleClose}
          sx={{ fontSize: "0.8rem", textTransform: "none", color: "#666" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={!selectedEntryId || editor?.state.selection.empty}
          sx={{
            fontSize: "0.8rem",
            textTransform: "none",
            background: "linear-gradient(#fff 2%, #ddd 95%, #bbb 100%)",
            border: "1px solid #bbb",
            color: "#2a2a2a",
            px: 2,
            "&:hover": {
              background: "linear-gradient(#fff 2%, #ccc 95%, #aaa 100%)",
            },
            "&:disabled": {
              color: "#999",
              borderColor: "#ddd",
            },
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
