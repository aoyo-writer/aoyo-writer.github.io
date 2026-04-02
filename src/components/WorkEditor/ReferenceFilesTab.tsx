import { useState, useCallback } from "react";
import { Box, Typography, IconButton, Tooltip, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PushPinIcon from "@mui/icons-material/PushPin";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import { useReferenceFiles, addReferenceFile, deleteReferenceFile } from "../../db/useWorks";
import type { BibliographyEntry, ReferenceFile } from "../../types";

interface ReferenceFilesTabProps {
  workId: number;
  entries?: BibliographyEntry[];
  onPinPdf?: (blobUrl: string, filename: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export default function ReferenceFilesTab({ workId, entries, onPinPdf }: ReferenceFilesTabProps) {
  const files = useReferenceFiles(workId);
  const [viewingFile, setViewingFile] = useState<{ url: string; filename: string } | null>(null);

  const handleFileUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.multiple = true;
    input.onchange = async (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList) return;
      for (const file of Array.from(fileList)) {
        await addReferenceFile({
          workId,
          bibEntryId: null,
          filename: file.name,
          mimeType: file.type || "application/pdf",
          data: file,
        });
      }
    };
    input.click();
  }, [workId]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const fileList = e.dataTransfer.files;
      for (const file of Array.from(fileList)) {
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          await addReferenceFile({
            workId,
            bibEntryId: null,
            filename: file.name,
            mimeType: "application/pdf",
            data: file,
          });
        }
      }
    },
    [workId],
  );

  const handleViewInline = (file: ReferenceFile) => {
    if (viewingFile) URL.revokeObjectURL(viewingFile.url);
    const url = URL.createObjectURL(file.data);
    setViewingFile({ url, filename: file.filename });
  };

  const handleCloseViewer = () => {
    if (viewingFile) {
      URL.revokeObjectURL(viewingFile.url);
      setViewingFile(null);
    }
  };

  const handlePinFromViewer = () => {
    if (viewingFile && onPinPdf) {
      // Don't revoke — the side panel takes ownership of the URL
      onPinPdf(viewingFile.url, viewingFile.filename);
      setViewingFile(null);
    }
  };

  const handleOpenInTab = (file: ReferenceFile) => {
    const url = URL.createObjectURL(file.data);
    window.open(url, "_blank");
  };

  const handlePin = (file: ReferenceFile) => {
    const url = URL.createObjectURL(file.data);
    onPinPdf?.(url, file.filename);
  };

  const handleDelete = async (id: number) => {
    await deleteReferenceFile(id);
  };

  const getLinkedEntryName = (bibEntryId: number | null) => {
    if (!bibEntryId || !entries) return null;
    const entry = entries.find((e) => e.id === bibEntryId);
    return entry ? `[${entry.citeKey}]` : null;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Upload area */}
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{
          border: "1px dashed #ccc",
          borderRadius: "0.25em",
          p: 1,
          textAlign: "center",
          mb: 1,
          backgroundColor: "#fafafa",
          cursor: "pointer",
          flexShrink: 0,
          "&:hover": { borderColor: "#900" },
        }}
        onClick={handleFileUpload}
      >
        <UploadFileIcon sx={{ fontSize: 20, color: "#999" }} />
        <Typography sx={{ fontSize: "0.7rem", color: "#666" }}>
          Drop PDFs here or click to upload
        </Typography>
      </Box>

      {/* Content: file list + optional inline viewer */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* File list */}
        <Box sx={{ flex: viewingFile ? "0 0 auto" : 1, overflow: "auto", maxHeight: viewingFile ? 150 : undefined }}>
          {(!files || files.length === 0) && (
            <Typography
              sx={{ fontSize: "0.8rem", color: "#999", textAlign: "center", py: 2 }}
            >
              No reference files yet. Upload PDFs or download from the Search tab.
            </Typography>
          )}

          {(files ?? []).map((file) => (
            <Box
              key={file.id}
              onClick={() => handleViewInline(file)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                py: 0.5,
                px: 0.5,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                backgroundColor: viewingFile?.filename === file.filename ? "#f0f0f0" : "transparent",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "#2a2a2a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.filename}
                </Typography>
                <Typography sx={{ fontSize: "0.65rem", color: "#999" }}>
                  {formatBytes(file.data?.size ?? 0)}
                  {" · "}
                  {new Date(file.addedAt).toLocaleDateString()}
                  {getLinkedEntryName(file.bibEntryId) && (
                    <>
                      {" · "}
                      <LinkIcon sx={{ fontSize: 10, verticalAlign: "middle" }} />{" "}
                      {getLinkedEntryName(file.bibEntryId)}
                    </>
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Open in new tab">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenInTab(file)}
                    sx={{ p: 0.25 }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 14, color: "#069" }} />
                  </IconButton>
                </Tooltip>
                {onPinPdf && (
                  <Tooltip title="Pin to side panel">
                    <IconButton
                      size="small"
                      onClick={() => handlePin(file)}
                      sx={{ p: 0.25 }}
                    >
                      <PushPinIcon sx={{ fontSize: 14, color: "#666" }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(file.id!)}
                    sx={{ p: 0.25 }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 14, color: "#999" }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Inline PDF viewer */}
        {viewingFile && (
          <Box
            sx={{
              flex: 1,
              minHeight: 200,
              borderTop: "2px solid #900",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.25,
                backgroundColor: "#f5f5f5",
                borderBottom: "1px solid #ddd",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "#666",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {viewingFile.filename}
              </Typography>
              {onPinPdf && (
                <Tooltip title="Pin to side panel">
                  <Button
                    size="small"
                    onClick={handlePinFromViewer}
                    sx={{
                      fontSize: "0.65rem",
                      textTransform: "none",
                      color: "#666",
                      minWidth: "auto",
                      p: "0 6px",
                    }}
                    startIcon={<PushPinIcon sx={{ fontSize: 12 }} />}
                  >
                    Pin
                  </Button>
                </Tooltip>
              )}
              <IconButton size="small" onClick={handleCloseViewer} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 14, color: "#666" }} />
              </IconButton>
            </Box>
            <Box
              component="iframe"
              src={viewingFile.url}
              sx={{
                flex: 1,
                border: "none",
                minHeight: 200,
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
