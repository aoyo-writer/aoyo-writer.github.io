import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { getSettings, sqlDb } from "../db/sqlite";
import type { AppSettings, ChapterMode } from "../types";

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
const sectionHeadingSx = {
  fontFamily: "Georgia, serif",
  fontSize: "1.1em",
  fontWeight: "normal",
  mb: 1,
  borderBottom: "1px solid #eee",
  pb: 0.5,
};

export default function GlobalSettings() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Local form state
  const [defaultChapterMode, setDefaultChapterMode] = useState<ChapterMode>("single");
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupIntervalDays, setAutoBackupIntervalDays] = useState("7");
  const [customTagCategories, setCustomTagCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setDefaultChapterMode(s.defaultChapterMode);
      setToolbarCollapsed(s.toolbarCollapsed);
      setAutoBackupEnabled(s.autoBackupEnabled);
      setAutoBackupIntervalDays(String(s.autoBackupIntervalDays));
      setCustomTagCategories([...s.customTagCategories]);
    });
  }, []);

  if (!settings) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", px: "3em", py: "1em" }}>
        <Typography sx={{ color: "#666" }}>Loading...</Typography>
      </Box>
    );
  }

  const handleSave = async () => {
    await sqlDb.sql`UPDATE settings SET
      defaultChapterMode = ${defaultChapterMode},
      toolbarCollapsed = ${toolbarCollapsed ? 1 : 0},
      autoBackupEnabled = ${autoBackupEnabled ? 1 : 0},
      autoBackupIntervalDays = ${parseInt(autoBackupIntervalDays) || 7},
      customTagCategories = ${JSON.stringify(customTagCategories)}
    WHERE id = 1`;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !customTagCategories.includes(trimmed)) {
      setCustomTagCategories([...customTagCategories, trimmed]);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCustomTagCategories(customTagCategories.filter((c) => c !== cat));
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
        Settings
      </Typography>

      {/* General */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          General
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography component="label" sx={labelSx}>
            Default Chapter Mode
          </Typography>
          <RadioGroup
            value={defaultChapterMode}
            onChange={(e) => setDefaultChapterMode(e.target.value as ChapterMode)}
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

        <FormControlLabel
          control={
            <Checkbox
              checked={toolbarCollapsed}
              onChange={(e) => setToolbarCollapsed(e.target.checked)}
              size="small"
              sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.85rem" }}>
              Collapse editor toolbar by default
            </Typography>
          }
        />
      </Box>

      {/* Backup */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Backup
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              size="small"
              sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.85rem" }}>
              Enable auto-backup reminders
            </Typography>
          }
          sx={{ mb: 1 }}
        />

        <Box sx={{ ml: 3, mb: 1 }}>
          <Typography component="label" sx={labelSx}>
            Reminder interval (days)
          </Typography>
          <TextField
            size="small"
            type="number"
            value={autoBackupIntervalDays}
            onChange={(e) => setAutoBackupIntervalDays(e.target.value)}
            disabled={!autoBackupEnabled}
            sx={{ ...inputSx, width: 120 }}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Box>

        {settings.lastAutoBackupAt && (
          <Typography sx={{ fontSize: "0.8rem", color: "#666", ml: 3 }}>
            Last backup:{" "}
            {new Date(settings.lastAutoBackupAt).toLocaleDateString()}
          </Typography>
        )}
      </Box>

      {/* Custom Tag Categories */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Custom Tag Categories
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1.5 }}>
          Define additional tag categories beyond the built-in ones (Subjects,
          Topics, Key Terms, etc.)
        </Typography>

        {customTagCategories.length === 0 && (
          <Typography
            sx={{ fontSize: "0.8rem", color: "#999", mb: 1, fontStyle: "italic" }}
          >
            No custom categories yet.
          </Typography>
        )}

        {customTagCategories.map((cat) => (
          <Box
            key={cat}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 0.5,
              borderBottom: "1px solid #eee",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem", flex: 1 }}>{cat}</Typography>
            <Tooltip title="Remove">
              <IconButton
                size="small"
                onClick={() => handleRemoveCategory(cat)}
                sx={{ p: 0.25 }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16, color: "#999" }} />
              </IconButton>
            </Tooltip>
          </Box>
        ))}

        <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
          <TextField
            size="small"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            sx={{ ...inputSx, flex: 1 }}
          />
          <Tooltip title="Add category">
            <IconButton
              size="small"
              onClick={handleAddCategory}
              sx={{ p: 0.5 }}
            >
              <AddIcon sx={{ fontSize: 18, color: "#900" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* API Keys (Future) */}
      <Box sx={{ ...fieldsetSx, opacity: 0.5 }}>
        <Typography component="h3" sx={sectionHeadingSx}>
          API Keys
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>
          Configuration for external API integrations (e.g., plagiarism
          checking) will be available in a future update.
        </Typography>
      </Box>

      {/* Save */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
        <Button onClick={handleSave} sx={ao3ButtonSx}>
          Save Settings
        </Button>
        {saved && (
          <Typography sx={{ fontSize: "0.85rem", color: "#090" }}>
            Saved!
          </Typography>
        )}
      </Box>
    </Box>
  );
}
