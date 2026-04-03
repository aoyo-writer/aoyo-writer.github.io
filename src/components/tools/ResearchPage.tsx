import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  useMediaQuery,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useSearchParams, Link } from "react-router-dom";
import { useAllWorks, useWork } from "../../db/useWorks";
import { CitationStyleContext } from "../../hooks/useCitationStyle";
import BibliographyDrawer from "../WorkEditor/BibliographyDrawer";

export default function ResearchPage() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWorkId = searchParams.get("work");
  const [selectedWorkId, setSelectedWorkId] = useState<number | "">(
    initialWorkId ? parseInt(initialWorkId) : "",
  );
  const [pinnedPdf, setPinnedPdf] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const works = useAllWorks();
  const work = useWork(selectedWorkId || undefined);

  // Sync URL when work changes
  useEffect(() => {
    const current = searchParams.get("work");
    const target = selectedWorkId ? String(selectedWorkId) : null;
    if (current !== target) {
      if (target) {
        setSearchParams({ work: target }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [selectedWorkId, searchParams, setSearchParams]);

  // Clear pinned PDF when switching works
  useEffect(() => {
    if (pinnedPdf) {
      URL.revokeObjectURL(pinnedPdf.url);
      setPinnedPdf(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkId]);

  const handleWorkChange = (e: SelectChangeEvent<number | "">) => {
    const val = e.target.value;
    setSelectedWorkId(val === "" ? "" : Number(val));
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: isMobile ? 1 : "3em",
        py: "1em",
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Page title */}
      <Typography
        component="h2"
        sx={{
          fontFamily: "Georgia, serif",
          fontSize: "1.5em",
          fontWeight: "normal",
          color: "#2a2a2a",
          mb: 1,
        }}
      >
        Research Library
      </Typography>

      {/* Work selector */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          pb: 1.5,
          borderBottom: "1px solid #eee",
        }}
      >
        <Typography sx={{ fontSize: "0.85rem", color: "#666", flexShrink: 0 }}>
          Work:
        </Typography>
        <Select
          size="small"
          value={selectedWorkId}
          onChange={handleWorkChange}
          displayEmpty
          sx={{
            minWidth: 250,
            maxWidth: 450,
            fontSize: "0.85rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ccc",
            },
          }}
        >
          <MenuItem value="" sx={{ fontSize: "0.85rem", color: "#999" }}>
            Select a work...
          </MenuItem>
          {works?.map((w) => (
            <MenuItem key={w.id} value={w.id} sx={{ fontSize: "0.85rem" }}>
              {w.title}
            </MenuItem>
          ))}
        </Select>

        {work && (
          <Link
            to={`/work/${work.id}`}
            style={{
              fontSize: "0.8rem",
              color: "#900",
              textDecoration: "none",
              marginLeft: "auto",
            }}
          >
            Back to editor
          </Link>
        )}
      </Box>

      {/* Content */}
      {selectedWorkId && work ? (
        <CitationStyleContext.Provider
          value={work.citationStyle ?? "apa"}
        >
          <Box sx={{ display: "flex", gap: 0, flex: 1, overflow: "hidden", minHeight: 0 }}>
            {/* Main research panel */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <BibliographyDrawer
                workId={selectedWorkId}
                editor={null}
                onPinPdf={(url, filename) => setPinnedPdf({ url, filename })}
              />
            </Box>

            {/* Pinned PDF side panel */}
            {pinnedPdf && (
              <Box
                sx={{
                  width: "45%",
                  minWidth: 300,
                  maxWidth: 600,
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
                  }}
                />
              </Box>
            )}
          </Box>
        </CitationStyleContext.Provider>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "#999",
            flex: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, serif",
              fontSize: "1.1em",
              mb: 1,
            }}
          >
            Select a work above to manage its research library
          </Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>
            Search papers, manage bibliography entries, and organise reference
            files.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
