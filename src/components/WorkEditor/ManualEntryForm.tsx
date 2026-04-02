import { useState } from "react";
import { Box, TextField, Button, Typography, MenuItem, CircularProgress } from "@mui/material";
import { addBibEntry } from "../../db/useWorks";
import { fetchByDoi, generateCiteKey } from "../../utils/crossref";

interface ManualEntryFormProps {
  workId: number;
  onAdded: () => void;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: "0.8rem",
    borderRadius: "0.25em",
  },
};

const entryTypes = [
  "article",
  "book",
  "inproceedings",
  "inbook",
  "incollection",
  "thesis",
  "techreport",
  "misc",
];

export default function ManualEntryForm({
  workId,
  onAdded,
}: ManualEntryFormProps) {
  const [citeKey, setCiteKey] = useState("");
  const [entryType, setEntryType] = useState("article");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");
  const [volume, setVolume] = useState("");
  const [pages, setPages] = useState("");
  const [publisher, setPublisher] = useState("");
  const [url, setUrl] = useState("");
  const [doi, setDoi] = useState("");
  const [lookupDoi, setLookupDoi] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleDoiLookup = async () => {
    if (!lookupDoi.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const result = await fetchByDoi(lookupDoi.trim());
      if (!result) {
        setLookupError("DOI not found in CrossRef.");
        return;
      }
      setTitle(result.title);
      setAuthors(result.authors);
      setYear(result.year);
      setEntryType(result.entryType);
      setDoi(result.doi);
      setUrl(result.url ?? "");
      setJournal(result.journal ?? "");
      setVolume(result.volume ?? "");
      setPages(result.pages ?? "");
      setPublisher(result.publisher ?? "");
      setCiteKey(generateCiteKey(result.authors, result.year));
    } catch (e) {
      setLookupError(`Lookup failed: ${e}`);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async () => {
    if (!citeKey || !title || !authors || !year) return;
    await addBibEntry({
      workId,
      citeKey,
      entryType,
      title,
      authors,
      year,
      journal: journal || undefined,
      volume: volume || undefined,
      pages: pages || undefined,
      publisher: publisher || undefined,
      url: url || undefined,
      doi: doi || undefined,
      raw: "",
    });
    // Reset form
    setCiteKey("");
    setTitle("");
    setAuthors("");
    setYear("");
    setJournal("");
    setVolume("");
    setPages("");
    setPublisher("");
    setUrl("");
    setDoi("");
    onAdded();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* DOI Auto-fill */}
      <Box
        sx={{
          p: 1,
          backgroundColor: "#fafafa",
          border: "1px solid #eee",
          borderRadius: "0.25em",
          mb: 0.5,
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", fontWeight: "bold", color: "#2a2a2a", mb: 0.5 }}>
          Quick Add from DOI
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="10.1000/xyz123 or paste full DOI URL"
            value={lookupDoi}
            onChange={(e) => setLookupDoi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDoiLookup();
            }}
            sx={{ ...fieldSx, flex: 1 }}
          />
          <Button
            onClick={handleDoiLookup}
            disabled={lookingUp || !lookupDoi.trim()}
            size="small"
            sx={{
              fontSize: "0.75rem",
              textTransform: "none",
              minWidth: "auto",
              p: "2px 8px",
              color: "#900",
            }}
          >
            {lookingUp ? <CircularProgress size={14} sx={{ color: "#900" }} /> : "Lookup"}
          </Button>
        </Box>
        {lookupError && (
          <Typography sx={{ fontSize: "0.65rem", color: "#c00", mt: 0.5 }}>
            {lookupError}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Citation Key *
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={citeKey}
            onChange={(e) => setCiteKey(e.target.value)}
            placeholder="smith2024"
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Type
          </Typography>
          <TextField
            size="small"
            fullWidth
            select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
            sx={fieldSx}
          >
            {entryTypes.map((t) => (
              <MenuItem key={t} value={t} sx={{ fontSize: "0.8rem" }}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
          Title *
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={fieldSx}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ flex: 2 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Authors * (use "and" between names)
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="Last, First and Last, First"
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Year *
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Journal
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: "0 0 80px" }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Volume
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: "0 0 100px" }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Pages
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="1-15"
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            Publisher
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
            DOI
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="10.1000/xyz123"
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: "0.7rem", color: "#666", mb: 0.25 }}>
          URL
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          sx={fieldSx}
        />
      </Box>

      <Button
        onClick={handleSubmit}
        disabled={!citeKey || !title || !authors || !year}
        sx={{
          alignSelf: "flex-start",
          background: "linear-gradient(#fff 2%, #ddd 95%, #bbb 100%)",
          border: "1px solid #bbb",
          color: "#2a2a2a",
          fontSize: "0.8rem",
          textTransform: "none",
          p: "0.2em 0.75em",
          borderRadius: "0.25em",
          "&:hover": {
            background: "linear-gradient(#fff 2%, #ccc 95%, #aaa 100%)",
          },
          "&:disabled": { opacity: 0.5 },
        }}
      >
        Add Entry
      </Button>
    </Box>
  );
}
