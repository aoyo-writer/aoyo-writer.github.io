import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  LinearProgress,
  useMediaQuery,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import { useAllWorks } from "../../db/useWorks";
import {
  exportFullBackup,
  exportWorkBackup,
  importBackup,
  getBackupSummary,
  type BackupData,
  type ImportResult,
} from "../../utils/backup";

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
const sectionHeadingSx = {
  fontFamily: "Georgia, serif",
  fontSize: "1.1em",
  fontWeight: "normal",
  mb: 1,
  borderBottom: "1px solid #eee",
  pb: 0.5,
};

function downloadJson(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export default function BackupPage() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const works = useAllWorks();

  // Full backup
  const [exporting, setExporting] = useState(false);

  // Import
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importMode, setImportMode] = useState<"overwrite" | "skip">("skip");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Per-work
  const [selectedWorkId, setSelectedWorkId] = useState<number | "">("");
  const [exportingWork, setExportingWork] = useState(false);

  // Storage
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    navigator.storage?.estimate().then((est) => {
      setStorage({ usage: est.usage ?? 0, quota: est.quota ?? 0 });
    });
  }, []);

  const handleFullExport = async () => {
    setExporting(true);
    try {
      const data = await exportFullBackup();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(data, `aoyo-backup-${date}.json`);
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;
        if (!data.version || !data.works) {
          setImportError("Invalid backup file format.");
          return;
        }
        setImportData(data);
      } catch {
        setImportError("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importBackup(importData, importMode);
      setImportResult(result);
      setImportData(null);
    } catch (e) {
      setImportError(`Import failed: ${e}`);
    } finally {
      setImporting(false);
    }
  };

  const handleWorkExport = async () => {
    if (!selectedWorkId) return;
    setExportingWork(true);
    try {
      const data = await exportWorkBackup(selectedWorkId as number);
      const work = data.works[0];
      const slug = work.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      downloadJson(data, `aoyo-${slug}-backup.json`);
    } finally {
      setExportingWork(false);
    }
  };

  const summary = importData ? getBackupSummary(importData) : null;

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
        Backup &amp; Import
      </Typography>

      {/* Full Backup */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Full Database Backup
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "#666", mb: 1.5 }}>
          Export all works, chapters, bibliography entries, save points, and
          reference files as a single JSON file.
        </Typography>
        <Button
          onClick={handleFullExport}
          disabled={exporting}
          startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
          sx={ao3ButtonSx}
        >
          {exporting ? "Exporting..." : "Export Full Backup"}
        </Button>
      </Box>

      {/* Import */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Import Backup
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <Button component="label" sx={ao3ButtonSx} startIcon={<UploadIcon sx={{ fontSize: 16 }} />}>
            Select Backup File
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleFileSelect}
            />
          </Button>
        </Box>

        {importError && (
          <Typography sx={{ fontSize: "0.85rem", color: "#c00", mb: 1 }}>
            {importError}
          </Typography>
        )}

        {summary && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold", mb: 0.5 }}>
              Backup contents:
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
              {summary.works} work{summary.works !== 1 ? "s" : ""},
              {" "}{summary.chapters} chapter{summary.chapters !== 1 ? "s" : ""},
              {" "}{summary.bibliography} bibliography entr{summary.bibliography !== 1 ? "ies" : "y"},
              {" "}{summary.savePoints} save point{summary.savePoints !== 1 ? "s" : ""},
              {" "}{summary.referenceFiles} reference file{summary.referenceFiles !== 1 ? "s" : ""}
              {summary.hasSettings ? ", settings included" : ""}
            </Typography>

            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold", mb: 0.5 }}>
                Conflict resolution:
              </Typography>
              <RadioGroup
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as "overwrite" | "skip")}
              >
                <FormControlLabel
                  value="skip"
                  control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
                  label={<Typography sx={{ fontSize: "0.85rem" }}>Skip existing items (safer)</Typography>}
                  sx={{ mb: -0.5 }}
                />
                <FormControlLabel
                  value="overwrite"
                  control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#900" }, p: "2px", ml: 1 }} />}
                  label={<Typography sx={{ fontSize: "0.85rem" }}>Overwrite existing items</Typography>}
                />
              </RadioGroup>
            </Box>

            <Button
              onClick={handleImport}
              disabled={importing}
              sx={ao3ButtonSx}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
            {importing && <LinearProgress sx={{ mt: 1 }} />}
          </Box>
        )}

        {importResult && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              backgroundColor: importResult.errors.length > 0 ? "#fef0f0" : "#f0fef0",
              border: `1px solid ${importResult.errors.length > 0 ? "#fcc" : "#cfc"}`,
              borderRadius: "0.25em",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem" }}>
              Imported {importResult.imported} item{importResult.imported !== 1 ? "s" : ""},
              skipped {importResult.skipped}
              {importResult.errors.length > 0 &&
                `, ${importResult.errors.length} error${importResult.errors.length !== 1 ? "s" : ""}`}
            </Typography>
            {importResult.errors.map((err, i) => (
              <Typography key={i} sx={{ fontSize: "0.75rem", color: "#900", mt: 0.5 }}>
                {err}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {/* Per-Work Export */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Per-Work Export
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Select
            size="small"
            value={selectedWorkId}
            onChange={(e) => setSelectedWorkId(e.target.value as number)}
            displayEmpty
            sx={{ minWidth: 250, fontSize: "0.85rem", borderRadius: "0.25em" }}
          >
            <MenuItem value="" disabled>
              <em>Select a work</em>
            </MenuItem>
            {(works ?? []).map((w) => (
              <MenuItem key={w.id} value={w.id!} sx={{ fontSize: "0.85rem" }}>
                {w.title}
              </MenuItem>
            ))}
          </Select>
          <Button
            onClick={handleWorkExport}
            disabled={!selectedWorkId || exportingWork}
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            sx={ao3ButtonSx}
          >
            {exportingWork ? "Exporting..." : "Export Work"}
          </Button>
        </Box>
      </Box>

      {/* Storage Info */}
      {storage && (
        <Box sx={fieldsetSx}>
          <Typography component="h3" sx={sectionHeadingSx}>
            Storage
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>
            Using {formatBytes(storage.usage)} of {formatBytes(storage.quota)} (
            {storage.quota > 0 ? Math.round((storage.usage / storage.quota) * 100) : 0}%)
          </Typography>
        </Box>
      )}
    </Box>
  );
}
