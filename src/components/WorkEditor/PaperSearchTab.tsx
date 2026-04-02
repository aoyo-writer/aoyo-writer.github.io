import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { searchPapers, type OpenAlexResult } from "../../utils/openAlex";
import { generateCiteKey } from "../../utils/crossref";
import { addBibEntry, addReferenceFile } from "../../db/useWorks";

interface PaperSearchTabProps {
  workId: number;
  onAdded?: () => void;
}

export default function PaperSearchTab({ workId, onAdded }: PaperSearchTabProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenAlexResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedDois, setAddedDois] = useState<Set<string>>(new Set());
  const [downloadingDoi, setDownloadingDoi] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSearch = async (newPage = 1) => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await searchPapers(query.trim(), newPage);
      if (newPage === 1) {
        setResults(data.results);
        setSelectedIndex(null);
      } else {
        setResults((prev) => [...prev, ...data.results]);
      }
      setTotalCount(data.totalCount);
      setPage(newPage);
    } catch (e) {
      setError(`Search failed: ${e}`);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToBibliography = async (result: OpenAlexResult) => {
    const citeKey = generateCiteKey(result.authors, result.year);
    await addBibEntry({
      workId,
      citeKey,
      entryType: "article",
      title: result.title,
      authors: result.authors,
      year: result.year,
      journal: result.journal,
      doi: result.doi,
      url: result.doi ? `https://doi.org/${result.doi}` : undefined,
      abstract: result.abstract,
      raw: "",
    });
    if (result.doi) {
      setAddedDois((prev) => new Set(prev).add(result.doi!));
    }
    onAdded?.();
  };

  const handleDownloadPdf = async (result: OpenAlexResult) => {
    if (!result.openAccessUrl) return;
    setDownloadingDoi(result.doi ?? result.title);
    try {
      const resp = await fetch(result.openAccessUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();

      let bibEntryId: number | null = null;
      if (result.doi && !addedDois.has(result.doi)) {
        const citeKey = generateCiteKey(result.authors, result.year);
        bibEntryId = await addBibEntry({
          workId,
          citeKey,
          entryType: "article",
          title: result.title,
          authors: result.authors,
          year: result.year,
          journal: result.journal,
          doi: result.doi,
          url: result.openAccessUrl,
          abstract: result.abstract,
          raw: "",
        });
        setAddedDois((prev) => new Set(prev).add(result.doi!));
      }

      const filename = `${result.authors.split(" and ")[0]?.split(",")[0] ?? "paper"}_${result.year}.pdf`;
      await addReferenceFile({
        workId,
        bibEntryId,
        filename,
        mimeType: "application/pdf",
        data: blob,
      });
      onAdded?.();
    } catch (e) {
      alert(`Failed to download PDF: ${e}`);
    } finally {
      setDownloadingDoi(null);
    }
  };

  const selected = selectedIndex != null ? results[selectedIndex] : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search bar */}
      <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search papers by title, author, keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              fontSize: "0.8rem",
              height: 28,
              borderRadius: "0.25em",
            },
          }}
        />
        <IconButton
          size="small"
          onClick={() => handleSearch()}
          disabled={searching || !query.trim()}
        >
          <SearchIcon sx={{ fontSize: 16, color: "#900" }} />
        </IconButton>
      </Box>

      {error && (
        <Typography sx={{ fontSize: "0.75rem", color: "#c00", mb: 1, flexShrink: 0 }}>
          {error}
        </Typography>
      )}

      {/* Master-detail split */}
      <Box sx={{ flex: 1, display: "flex", gap: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Left: result list */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {results.length === 0 && !searching && (
            <Typography sx={{ fontSize: "0.8rem", color: "#999", textAlign: "center", py: 2 }}>
              Search OpenAlex to find papers and add them to your bibliography.
            </Typography>
          )}

          {searching && results.length === 0 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress size={20} sx={{ color: "#900" }} />
            </Box>
          )}

          {results.map((result, i) => (
            <Box
              key={`${result.doi ?? i}-${i}`}
              onClick={() => setSelectedIndex(i)}
              sx={{
                py: 0.5,
                px: 0.75,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                backgroundColor: selectedIndex === i ? "#fff3cd" : "transparent",
                borderLeft: selectedIndex === i ? "3px solid #d4a800" : "3px solid transparent",
                "&:hover": {
                  backgroundColor: selectedIndex === i ? "#fff3cd" : "#f9f9f9",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  color: "#2a2a2a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {result.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: "#666",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {result.authors}{result.year && ` (${result.year})`}
              </Typography>
            </Box>
          ))}

          {results.length > 0 && results.length < totalCount && (
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Button
                size="small"
                onClick={() => handleSearch(page + 1)}
                disabled={searching}
                sx={{ fontSize: "0.7rem", textTransform: "none", color: "#900" }}
              >
                {searching ? "Loading..." : `Load more (${results.length}/${totalCount})`}
              </Button>
            </Box>
          )}
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
          {!selected ? (
            <Typography sx={{ fontSize: "0.75rem", color: "#bbb", textAlign: "center", py: 3 }}>
              Select a result to view details
            </Typography>
          ) : (
            <Box>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: "bold", color: "#2a2a2a", mb: 0.5 }}>
                {selected.title}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.5 }}>
                {selected.authors}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "#888", mb: 1 }}>
                {selected.year && `${selected.year}`}
                {selected.journal && ` — ${selected.journal}`}
                {selected.citedByCount != null && ` · Cited by ${selected.citedByCount}`}
              </Typography>

              {/* DOI link */}
              {selected.doi && (
                <Box sx={{ mb: 1 }}>
                  <a
                    href={`https://doi.org/${selected.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#069",
                      textDecoration: "none",
                      fontSize: "0.7rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    doi:{selected.doi}
                    <OpenInNewIcon sx={{ fontSize: 11 }} />
                  </a>
                </Box>
              )}

              {/* Abstract */}
              {selected.abstract && (
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#555",
                    mb: 1,
                    p: 0.75,
                    backgroundColor: "#f9f9f9",
                    borderRadius: "0.25em",
                    lineHeight: 1.5,
                    borderLeft: "3px solid #ddd",
                  }}
                >
                  {selected.abstract}
                </Typography>
              )}

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  onClick={() => handleAddToBibliography(selected)}
                  disabled={selected.doi ? addedDois.has(selected.doi) : false}
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: "0.7rem",
                    textTransform: "none",
                    color: selected.doi && addedDois.has(selected.doi) ? "#ccc" : "#900",
                    borderColor: "#ddd",
                    px: 1,
                  }}
                  variant="outlined"
                >
                  {selected.doi && addedDois.has(selected.doi) ? "Added" : "Add to bibliography"}
                </Button>
                {selected.openAccessUrl && (
                  <Button
                    size="small"
                    onClick={() => handleDownloadPdf(selected)}
                    disabled={downloadingDoi === (selected.doi ?? selected.title)}
                    startIcon={
                      downloadingDoi === (selected.doi ?? selected.title)
                        ? <CircularProgress size={12} />
                        : <DownloadIcon sx={{ fontSize: 14 }} />
                    }
                    sx={{ fontSize: "0.7rem", textTransform: "none", color: "#069", borderColor: "#ddd", px: 1 }}
                    variant="outlined"
                  >
                    Download PDF
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
