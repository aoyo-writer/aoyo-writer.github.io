import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { Editor } from "@tiptap/react";
import type { BibliographyEntry } from "../../types";
import { useBibliography, addBibEntry, deleteBibEntry, updateBibEntry } from "../../db/useWorks";
import { parseBibTeX } from "../../utils/bibtex";
import { formatBibliographyEntry } from "../../utils/citationFormatter";
import { useCitationStyle } from "../../hooks/useCitationStyle";
import { verifyDoi } from "../../utils/crossref";
import ManualEntryForm from "./ManualEntryForm";
import PaperSearchTab from "./PaperSearchTab";
import ReferenceFilesTab from "./ReferenceFilesTab";

interface BibliographyDrawerProps {
  workId: number;
  editor: Editor | null;
  onPinPdf?: (blobUrl: string, filename: string) => void;
}

export default function BibliographyDrawer({
  workId,
  editor,
  onPinPdf,
}: BibliographyDrawerProps) {
  const citationStyle = useCitationStyle();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [doiStatus, setDoiStatus] = useState<Record<number, "checking" | "valid" | "invalid">>({});
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const entries = useBibliography(workId);

  const filteredEntries = (entries ?? []).filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.authors.toLowerCase().includes(q) ||
      e.citeKey.toLowerCase().includes(q)
    );
  });

  const selectedEntry = filteredEntries.find((e) => e.id === selectedEntryId) ?? null;

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
  };

  const handleBibTeXImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".bib";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = parseBibTeX(text);
      for (const entry of parsed) {
        await addBibEntry({ ...entry, workId });
      }
    };
    input.click();
  };

  const handleDelete = async (id: number) => {
    if (selectedEntryId === id) setSelectedEntryId(null);
    await deleteBibEntry(id);
  };

  const handleVerifyDoi = async (entry: BibliographyEntry) => {
    if (!entry.doi || !entry.id) return;
    setDoiStatus((prev) => ({ ...prev, [entry.id!]: "checking" }));
    const valid = await verifyDoi(entry.doi);
    setDoiStatus((prev) => ({ ...prev, [entry.id!]: valid ? "valid" : "invalid" }));
  };

  const handleBatchValidate = async () => {
    const withDoi = (entries ?? []).filter((e) => e.doi && e.id);
    for (const entry of withDoi) {
      await handleVerifyDoi(entry);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => { setTabIndex(v); setSelectedEntryId(null); }}
        sx={{ minHeight: 32, mb: 1, flexShrink: 0 }}
      >
        <Tab
          label={`Entries (${entries?.length ?? 0})`}
          sx={{ minHeight: 32, fontSize: "0.8rem", textTransform: "none", py: 0 }}
        />
        <Tab
          label="Add Entry"
          sx={{ minHeight: 32, fontSize: "0.8rem", textTransform: "none", py: 0 }}
        />
        <Tab
          label="Search"
          sx={{ minHeight: 32, fontSize: "0.8rem", textTransform: "none", py: 0 }}
        />
        <Tab
          label="Files"
          sx={{ minHeight: 32, fontSize: "0.8rem", textTransform: "none", py: 0 }}
        />
      </Tabs>

      {tabIndex === 0 && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {/* Toolbar */}
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexShrink: 0 }}>
            <TextField
              size="small"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.8rem",
                  height: 28,
                  borderRadius: "0.25em",
                },
              }}
            />
            <Tooltip title="Verify all DOIs">
              <IconButton size="small" onClick={handleBatchValidate}>
                <CheckCircleIcon sx={{ fontSize: 16, color: "#069" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import BibTeX file">
              <IconButton size="small" onClick={handleBibTeXImport}>
                <UploadFileIcon sx={{ fontSize: 16, color: "#666" }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Master-detail split */}
          <Box sx={{ flex: 1, display: "flex", gap: 1, overflow: "hidden", minHeight: 0 }}>
            {/* Left: entry list */}
            <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
              {filteredEntries.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "#999", py: 2, textAlign: "center" }}>
                  No bibliography entries yet. Add entries manually or import a BibTeX file.
                </Typography>
              )}

              {filteredEntries.map((entry) => (
                <Box
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id!)}
                  sx={{
                    py: 0.5,
                    px: 0.75,
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    backgroundColor: selectedEntryId === entry.id ? "#fff3cd" : "transparent",
                    borderLeft: selectedEntryId === entry.id ? "3px solid #d4a800" : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: selectedEntryId === entry.id ? "#fff3cd" : "#f9f9f9",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      color: "#900",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    [{entry.citeKey}]
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      color: "#2a2a2a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.title}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Right: detail panel */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                borderLeft: "1px solid #eee",
                pl: 1,
                overflow: "auto",
              }}
            >
              {!selectedEntry ? (
                <Typography sx={{ fontSize: "0.75rem", color: "#bbb", textAlign: "center", py: 3 }}>
                  Select an entry to view details
                </Typography>
              ) : (
                <Box>
                  {/* Citation key + actions */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: "bold", color: "#900", flex: 1 }}>
                      [{selectedEntry.citeKey}]
                    </Typography>
                    {selectedEntry.doi && (
                      <>
                        {doiStatus[selectedEntry.id!] === "checking" && (
                          <CircularProgress size={12} sx={{ color: "#999" }} />
                        )}
                        {doiStatus[selectedEntry.id!] === "valid" && (
                          <Tooltip title="DOI verified">
                            <CheckCircleIcon sx={{ fontSize: 14, color: "#090" }} />
                          </Tooltip>
                        )}
                        {doiStatus[selectedEntry.id!] === "invalid" && (
                          <Tooltip title="DOI not found">
                            <CancelIcon sx={{ fontSize: 14, color: "#c00" }} />
                          </Tooltip>
                        )}
                        {!doiStatus[selectedEntry.id!] && (
                          <Tooltip title="Verify DOI">
                            <IconButton size="small" onClick={() => handleVerifyDoi(selectedEntry)} sx={{ p: 0.25 }}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: "#ccc" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>

                  {/* Formatted citation */}
                  <Typography
                    sx={{ fontSize: "0.7rem", color: "#2a2a2a", mb: 0.75 }}
                    dangerouslySetInnerHTML={{ __html: formatBibliographyEntry(selectedEntry, citationStyle) }}
                  />

                  {/* Links */}
                  {selectedEntry.doi && (
                    <Box sx={{ mb: 0.5 }}>
                      <a
                        href={`https://doi.org/${selectedEntry.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#069",
                          textDecoration: "none",
                          fontSize: "0.65rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        doi:{selectedEntry.doi}
                        <OpenInNewIcon sx={{ fontSize: 11 }} />
                      </a>
                    </Box>
                  )}
                  {selectedEntry.url && !selectedEntry.url.includes("doi.org") && (
                    <Box sx={{ mb: 0.75 }}>
                      <a
                        href={selectedEntry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#069",
                          textDecoration: "none",
                          fontSize: "0.65rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {selectedEntry.url.length > 50 ? selectedEntry.url.slice(0, 50) + "..." : selectedEntry.url}
                        <OpenInNewIcon sx={{ fontSize: 11 }} />
                      </a>
                    </Box>
                  )}

                  {/* Abstract */}
                  {selectedEntry.abstract && (
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "#555",
                        mb: 0.75,
                        p: 0.75,
                        backgroundColor: "#f9f9f9",
                        borderRadius: "0.25em",
                        lineHeight: 1.5,
                        borderLeft: "3px solid #ddd",
                        maxHeight: 120,
                        overflow: "auto",
                      }}
                    >
                      {selectedEntry.abstract}
                    </Typography>
                  )}

                  {/* Notes */}
                  <TextField
                    key={selectedEntry.id}
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={5}
                    placeholder="Add notes about this source..."
                    defaultValue={selectedEntry.notes ?? ""}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val !== (selectedEntry.notes ?? "")) {
                        updateBibEntry(selectedEntry.id!, { notes: val || undefined });
                      }
                    }}
                    sx={{
                      width: "100%",
                      mb: 1,
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.7rem",
                        borderRadius: "0.25em",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e0e0e0",
                      },
                    }}
                  />

                  {/* Action buttons */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {editor ? (
                      <Button
                        size="small"
                        onClick={() => insertCitation(selectedEntry)}
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        sx={{ fontSize: "0.7rem", textTransform: "none", color: "#900", borderColor: "#ddd", px: 1 }}
                        variant="outlined"
                      >
                        Insert citation
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => navigator.clipboard.writeText(selectedEntry.citeKey)}
                        startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                        sx={{ fontSize: "0.7rem", textTransform: "none", color: "#900", borderColor: "#ddd", px: 1 }}
                        variant="outlined"
                      >
                        Copy cite key
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => handleDelete(selectedEntry.id!)}
                      startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                      sx={{ fontSize: "0.7rem", textTransform: "none", color: "#999", borderColor: "#ddd", px: 1 }}
                      variant="outlined"
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {tabIndex === 1 && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <ManualEntryForm workId={workId} onAdded={() => setTabIndex(0)} />
        </Box>
      )}

      {tabIndex === 2 && (
        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <PaperSearchTab workId={workId} onAdded={() => setTabIndex(0)} />
        </Box>
      )}

      {tabIndex === 3 && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <ReferenceFilesTab
            workId={workId}
            entries={entries ?? undefined}
            onPinPdf={onPinPdf}
          />
        </Box>
      )}
    </Box>
  );
}
