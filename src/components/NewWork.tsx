import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  useMediaQuery,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate } from "react-router-dom";
import { createWork, updateChapter, getChaptersByWorkId } from "../db/useWorks";
import { importDocx } from "../utils/importDocx";
import type { WorkStatus, WorkType, CompletionStatus, ChapterMode, CitationStyle } from "../types";

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

const fieldsetSx = {
  border: "1px solid #ddd",
  p: "1em",
  mb: 2,
  overflow: "hidden",
};

const labelSx = {
  fontSize: "0.85rem",
  fontWeight: "bold",
  color: "#2a2a2a",
  mb: 0.5,
  display: "block",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: "0.85rem",
    borderRadius: "0.25em",
  },
};

export default function NewWork() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 42em)");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<WorkType>("Essay");
  const [status, setStatus] = useState<WorkStatus>("Draft");
  const [completion] = useState<CompletionStatus>("Work in Progress");
  const [chapterMode, setChapterMode] = useState<ChapterMode>("single");
  const [subjects, setSubjects] = useState("");
  const [topics, setTopics] = useState("");
  const [keyTerms, setKeyTerms] = useState("");
  const [freeformTags, setFreeformTags] = useState("");
  const [warnings, setWarnings] = useState("");
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("apa");
  const [wordCountLimit, setWordCountLimit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [importingDocx, setImportingDocx] = useState(false);

  const handleDocxImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImportingDocx(true);
      try {
        const { json } = await importDocx(file);
        const name = file.name.replace(/\.docx$/i, "");
        const id = await createWork({
          title: name,
          summary: "",
          status: "Draft",
          type: "Essay",
          completionStatus: "Work in Progress",
          chapterMode: "single",
          subjects: [],
          topics: [],
          keyTerms: [],
          freeformTags: [],
          warnings: [],
          customTags: {},
          citationStyle: "apa",
          wordCountLimit: null,
          deadline: null,
          pinned: false,
          seriesId: null,
          seriesOrder: null,
        });
        // Update the initial chapter with imported content
        const chapters = await getChaptersByWorkId(id);
        if (chapters[0]) {
          await updateChapter(chapters[0].id!, {
            content: JSON.stringify(json),
          });
        }
        navigate(`/work/${id}`);
      } catch (err) {
        alert(`Import failed: ${err}`);
      } finally {
        setImportingDocx(false);
      }
    };
    input.click();
  };

  const splitTags = (s: string) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const id = await createWork({
      title: title.trim(),
      summary: summary.trim(),
      status,
      type,
      completionStatus: completion,
      chapterMode,
      subjects: splitTags(subjects),
      topics: splitTags(topics),
      keyTerms: splitTags(keyTerms),
      freeformTags: splitTags(freeformTags),
      warnings: splitTags(warnings),
      customTags: {},
      citationStyle,
      wordCountLimit: wordCountLimit ? parseInt(wordCountLimit) : null,
      deadline: deadline || null,
      pinned: false,
      seriesId: null,
      seriesOrder: null,
    });

    navigate(`/work/${id}`);
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
        New Work
      </Typography>

      {/* Import from file */}
      <Box sx={{ ...fieldsetSx, backgroundColor: "#fafafa" }}>
        <Typography component="label" sx={labelSx}>
          Import from File
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1 }}>
          Import content from a Word document (.docx). Creates a new work with
          the file contents.
        </Typography>
        <Button
          onClick={handleDocxImport}
          disabled={importingDocx}
          startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
          sx={ao3ButtonSx}
        >
          {importingDocx ? "Importing..." : "Import .docx"}
        </Button>
      </Box>

      {/* Title */}
      <Box sx={fieldsetSx}>
        <Typography component="label" sx={labelSx}>
          Title <span style={{ color: "#900" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the title of your work"
          sx={inputSx}
        />
      </Box>

      {/* Summary */}
      <Box sx={fieldsetSx}>
        <Typography component="label" sx={labelSx}>
          Summary
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief description of your work"
          sx={inputSx}
        />
      </Box>

      {/* Type and Status */}
      <Box sx={{ ...fieldsetSx, display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Type
          </Typography>
          <RadioGroup
            value={type}
            onChange={(e) => setType(e.target.value as WorkType)}
          >
            {(["Essay", "Research Paper", "Story", "Notes", "Other"] as WorkType[]).map(
              (t) => (
                <FormControlLabel
                  key={t}
                  value={t}
                  control={
                    <Radio
                      size="small"
                      sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                    />
                  }
                  label={<Typography sx={{ fontSize: "0.85rem" }}>{t}</Typography>}
                  sx={{ mb: -0.5 }}
                />
              ),
            )}
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Status
          </Typography>
          <RadioGroup
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkStatus)}
          >
            {(["Draft", "In Progress", "Final", "Archived"] as WorkStatus[]).map(
              (s) => (
                <FormControlLabel
                  key={s}
                  value={s}
                  control={
                    <Radio
                      size="small"
                      sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                    />
                  }
                  label={<Typography sx={{ fontSize: "0.85rem" }}>{s}</Typography>}
                  sx={{ mb: -0.5 }}
                />
              ),
            )}
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Chapter Mode
          </Typography>
          <RadioGroup
            value={chapterMode}
            onChange={(e) => setChapterMode(e.target.value as ChapterMode)}
          >
            <FormControlLabel
              value="single"
              control={
                <Radio
                  size="small"
                  sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.85rem" }}>
                  Single document
                </Typography>
              }
              sx={{ mb: -0.5 }}
            />
            <FormControlLabel
              value="chaptered"
              control={
                <Radio
                  size="small"
                  sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.85rem" }}>
                  Multiple chapters
                </Typography>
              }
            />
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Citation Style
          </Typography>
          <RadioGroup
            value={citationStyle}
            onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
          >
            <FormControlLabel
              value="apa"
              control={
                <Radio
                  size="small"
                  sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                />
              }
              label={<Typography sx={{ fontSize: "0.85rem" }}>APA 7th Edition</Typography>}
              sx={{ mb: -0.5 }}
            />
            <FormControlLabel
              value="oscola"
              control={
                <Radio
                  size="small"
                  sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
                />
              }
              label={<Typography sx={{ fontSize: "0.85rem" }}>OSCOLA (footnotes)</Typography>}
            />
          </RadioGroup>
        </Box>
      </Box>

      {/* Tags */}
      <Box sx={fieldsetSx}>
        <Typography
          component="h3"
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1.1em",
            fontWeight: "normal",
            mb: 1,
            borderBottom: "1px solid #eee",
            pb: 0.5,
          }}
        >
          Tags
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1.5 }}>
          Separate multiple tags with commas
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <Typography component="label" sx={labelSx}>
            Subjects
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="e.g. Philosophy, CS 301, Biology"
            sx={inputSx}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography component="label" sx={labelSx}>
            Topics
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="e.g. Ethics, Machine Learning, Ecology"
            sx={inputSx}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography component="label" sx={labelSx}>
            Key Terms
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={keyTerms}
            onChange={(e) => setKeyTerms(e.target.value)}
            placeholder="e.g. Kant, Neural Networks, Photosynthesis"
            sx={inputSx}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography component="label" sx={labelSx}>
            Additional Tags
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={freeformTags}
            onChange={(e) => setFreeformTags(e.target.value)}
            placeholder="e.g. Literature Review, Comparative Analysis"
            sx={inputSx}
          />
        </Box>

        <Box>
          <Typography component="label" sx={labelSx}>
            Warnings / Content Notes
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={warnings}
            onChange={(e) => setWarnings(e.target.value)}
            placeholder="e.g. Sensitive Content, Graphic Descriptions"
            sx={inputSx}
          />
        </Box>
      </Box>

      {/* Limits */}
      <Box sx={{ ...fieldsetSx, display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Word Count Limit
          </Typography>
          <TextField
            size="small"
            type="number"
            value={wordCountLimit}
            onChange={(e) => setWordCountLimit(e.target.value)}
            placeholder="No limit"
            sx={{ ...inputSx, width: 200 }}
          />
        </Box>

        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>
            Deadline
          </Typography>
          <TextField
            size="small"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            sx={{ ...inputSx, width: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Box>

      {/* Submit */}
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button onClick={handleSubmit} disabled={!title.trim()} sx={ao3ButtonSx}>
          Create Work
        </Button>
        <Button onClick={() => navigate(-1)} sx={ao3ButtonSx}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
