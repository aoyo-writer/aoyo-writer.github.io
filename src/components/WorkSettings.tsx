import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useWork, updateWork, deleteWork } from "../db/useWorks";
import type { Work, WorkStatus, WorkType, CompletionStatus, ChapterMode, CitationStyle } from "../types";

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

const fieldsetSx = { border: "1px solid #ddd", p: "1em", mb: 2 };
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

export default function WorkSettings() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 42em)");
  const work = useWork(id ? parseInt(id) : undefined);

  if (!work) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", px: "3em", py: "1em" }}>
        <Typography sx={{ color: "#666" }}>Loading...</Typography>
      </Box>
    );
  }

  return <WorkSettingsForm key={work.id} work={work} isMobile={isMobile} />;
}

function WorkSettingsForm({ work, isMobile }: { work: Work; isMobile: boolean }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(work.title);
  const [summary, setSummary] = useState(work.summary);
  const [type, setType] = useState<WorkType>(work.type);
  const [status, setStatus] = useState<WorkStatus>(work.status);
  const [completion, setCompletion] = useState<CompletionStatus>(work.completionStatus);
  const [chapterMode, setChapterMode] = useState<ChapterMode>(work.chapterMode);
  const [subjects, setSubjects] = useState(work.subjects.join(", "));
  const [topics, setTopics] = useState(work.topics.join(", "));
  const [keyTerms, setKeyTerms] = useState(work.keyTerms.join(", "));
  const [freeformTags, setFreeformTags] = useState(work.freeformTags.join(", "));
  const [warnings, setWarnings] = useState(work.warnings.join(", "));
  const [wordCountLimit, setWordCountLimit] = useState(work.wordCountLimit?.toString() ?? "");
  const [deadline, setDeadline] = useState(work.deadline ?? "");
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(work.citationStyle ?? "apa");
  const [pinned, setPinned] = useState(work.pinned);

  const splitTags = (s: string) =>
    s.split(",").map((t) => t.trim()).filter(Boolean);

  const handleSave = async () => {
    await updateWork(work.id!, {
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
      wordCountLimit: wordCountLimit ? parseInt(wordCountLimit) : null,
      deadline: deadline || null,
      citationStyle,
      pinned,
    });
    navigate(`/work/${work.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${work.title}"? This cannot be undone.`)) return;
    await deleteWork(work.id!);
    navigate("/works");
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
        Edit Work: {work.title}
      </Typography>

      {/* Title */}
      <Box sx={fieldsetSx}>
        <Typography component="label" sx={labelSx}>Title</Typography>
        <TextField
          fullWidth size="small" value={title}
          onChange={(e) => setTitle(e.target.value)} sx={inputSx}
        />
      </Box>

      {/* Summary */}
      <Box sx={fieldsetSx}>
        <Typography component="label" sx={labelSx}>Summary</Typography>
        <TextField
          fullWidth multiline rows={3} size="small" value={summary}
          onChange={(e) => setSummary(e.target.value)} sx={inputSx}
        />
      </Box>

      {/* Type, Status, Completion, Chapter Mode */}
      <Box sx={{ ...fieldsetSx, display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 150px" }}>
          <Typography component="label" sx={labelSx}>Type</Typography>
          <RadioGroup value={type} onChange={(e) => setType(e.target.value as WorkType)}>
            {(["Essay", "Research Paper", "Story", "Notes", "Other"] as WorkType[]).map((t) => (
              <FormControlLabel key={t} value={t}
                control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
                label={<Typography sx={{ fontSize: "0.85rem" }}>{t}</Typography>}
                sx={{ mb: -0.5 }}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 150px" }}>
          <Typography component="label" sx={labelSx}>Status</Typography>
          <RadioGroup value={status} onChange={(e) => setStatus(e.target.value as WorkStatus)}>
            {(["Draft", "In Progress", "Final", "Archived"] as WorkStatus[]).map((s) => (
              <FormControlLabel key={s} value={s}
                control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
                label={<Typography sx={{ fontSize: "0.85rem" }}>{s}</Typography>}
                sx={{ mb: -0.5 }}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 150px" }}>
          <Typography component="label" sx={labelSx}>Completion</Typography>
          <RadioGroup value={completion} onChange={(e) => setCompletion(e.target.value as CompletionStatus)}>
            {(["Complete", "Work in Progress"] as CompletionStatus[]).map((c) => (
              <FormControlLabel key={c} value={c}
                control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
                label={<Typography sx={{ fontSize: "0.85rem" }}>{c}</Typography>}
                sx={{ mb: -0.5 }}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box sx={{ flex: "1 1 150px" }}>
          <Typography component="label" sx={labelSx}>Chapter Mode</Typography>
          <RadioGroup value={chapterMode} onChange={(e) => setChapterMode(e.target.value as ChapterMode)}>
            <FormControlLabel value="single"
              control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
              label={<Typography sx={{ fontSize: "0.85rem" }}>Single document</Typography>}
              sx={{ mb: -0.5 }}
            />
            <FormControlLabel value="chaptered"
              control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
              label={<Typography sx={{ fontSize: "0.85rem" }}>Multiple chapters</Typography>}
            />
          </RadioGroup>

          <FormControlLabel
            control={
              <Checkbox
                checked={pinned} onChange={(e) => setPinned(e.target.checked)}
                size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
              />
            }
            label={<Typography sx={{ fontSize: "0.85rem" }}>Pinned to dashboard</Typography>}
            sx={{ mt: 1 }}
          />
        </Box>

        <Box sx={{ flex: "1 1 150px" }}>
          <Typography component="label" sx={labelSx}>Citation Style</Typography>
          <RadioGroup value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}>
            <FormControlLabel value="apa"
              control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
              label={<Typography sx={{ fontSize: "0.85rem" }}>APA 7th Edition</Typography>}
              sx={{ mb: -0.5 }}
            />
            <FormControlLabel value="oscola"
              control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
              label={<Typography sx={{ fontSize: "0.85rem" }}>OSCOLA (footnotes)</Typography>}
            />
          </RadioGroup>
        </Box>
      </Box>

      {/* Tags */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={{ fontFamily: "Georgia, serif", fontSize: "1.1em", fontWeight: "normal", mb: 1, borderBottom: "1px solid #eee", pb: 0.5 }}>
          Tags
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1.5 }}>
          Separate multiple tags with commas
        </Typography>

        {[
          { label: "Subjects", value: subjects, set: setSubjects },
          { label: "Topics", value: topics, set: setTopics },
          { label: "Key Terms", value: keyTerms, set: setKeyTerms },
          { label: "Additional Tags", value: freeformTags, set: setFreeformTags },
          { label: "Warnings", value: warnings, set: setWarnings },
        ].map((field) => (
          <Box key={field.label} sx={{ mb: 1.5 }}>
            <Typography component="label" sx={labelSx}>{field.label}</Typography>
            <TextField fullWidth size="small" value={field.value}
              onChange={(e) => field.set(e.target.value)} sx={inputSx}
            />
          </Box>
        ))}
      </Box>

      {/* Limits */}
      <Box sx={{ ...fieldsetSx, display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>Word Count Limit</Typography>
          <TextField size="small" type="number" value={wordCountLimit}
            onChange={(e) => setWordCountLimit(e.target.value)}
            placeholder="No limit" sx={{ ...inputSx, width: 200 }}
          />
        </Box>
        <Box sx={{ flex: "1 1 200px" }}>
          <Typography component="label" sx={labelSx}>Deadline</Typography>
          <TextField size="small" type="date" value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            sx={{ ...inputSx, width: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", mt: 1 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handleSave} sx={ao3ButtonSx}>
            Save Changes
          </Button>
          <Button onClick={() => navigate(`/work/${work.id}`)} sx={ao3ButtonSx}>
            Cancel
          </Button>
        </Box>
        <Button
          onClick={handleDelete}
          sx={{
            ...ao3ButtonSx,
            color: "#900",
            borderColor: "#900",
            "&:hover": { background: "#fdd", borderColor: "#900" },
          }}
        >
          Delete Work
        </Button>
      </Box>
    </Box>
  );
}
