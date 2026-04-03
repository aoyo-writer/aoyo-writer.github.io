import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Collapse,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import StorageIcon from "@mui/icons-material/Storage";
import { sqlDb, initSettings } from "../../db/sqlite";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

// === Table Browser Component ===

interface TableConfig {
  name: string;
  displayName: string;
  columns: string[]; // columns to display in summary view
  query: string;
  countQuery: string;
}

const TABLES: TableConfig[] = [
  {
    name: "works",
    displayName: "Works",
    columns: ["id", "title", "status", "type", "wordCount", "updatedAt"],
    query: "SELECT * FROM works ORDER BY updatedAt DESC LIMIT 20 OFFSET ?",
    countQuery: "SELECT COUNT(*) as cnt FROM works",
  },
  {
    name: "chapters",
    displayName: "Chapters",
    columns: ["id", "workId", "title", "order", "wordCount"],
    query: 'SELECT id, workId, title, "order", wordCount, createdAt, updatedAt FROM chapters ORDER BY workId, "order" LIMIT 20 OFFSET ?',
    countQuery: "SELECT COUNT(*) as cnt FROM chapters",
  },
  {
    name: "bibliography",
    displayName: "Bibliography",
    columns: ["id", "workId", "citeKey", "title", "authors", "year"],
    query: "SELECT * FROM bibliography ORDER BY workId, citeKey LIMIT 20 OFFSET ?",
    countQuery: "SELECT COUNT(*) as cnt FROM bibliography",
  },
  {
    name: "referenceFiles",
    displayName: "Reference Files",
    columns: ["id", "workId", "filename", "mimeType", "addedAt"],
    query: "SELECT id, workId, bibEntryId, filename, mimeType, LENGTH(data) as dataSize, addedAt FROM referenceFiles ORDER BY addedAt DESC LIMIT 20 OFFSET ?",
    countQuery: "SELECT COUNT(*) as cnt FROM referenceFiles",
  },
  {
    name: "savePoints",
    displayName: "Save Points",
    columns: ["id", "workId", "name", "createdAt"],
    query: "SELECT id, workId, chapterId, name, createdAt FROM savePoints ORDER BY createdAt DESC LIMIT 20 OFFSET ?",
    countQuery: "SELECT COUNT(*) as cnt FROM savePoints",
  },
  {
    name: "tags",
    displayName: "Tags",
    columns: ["id", "name", "category"],
    query: "SELECT * FROM tags ORDER BY category, name LIMIT 20 OFFSET ?",
    countQuery: "SELECT COUNT(*) as cnt FROM tags",
  },
  {
    name: "settings",
    displayName: "Settings",
    columns: ["id", "defaultChapterMode", "autoBackupEnabled", "toolbarCollapsed"],
    query: "SELECT * FROM settings",
    countQuery: "SELECT COUNT(*) as cnt FROM settings",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function TableBrowser({ table }: { table: TableConfig }) {
  const [expanded, setExpanded] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    sqlDb.exec(table.countQuery, [], "all").then((result) => {
      const rows = result.rows as unknown[][];
      setCount((rows[0]?.[0] as number) ?? 0);
    });
  }, [table.countQuery]);

  const loadPage = useCallback(
    async (p: number) => {
      const offset = p * 20;
      const result = await sqlDb.exec(table.query, [offset], "all");
      const cols = result.columns;
      const mapped = (result.rows as unknown[][]).map((row) => {
        const obj: Row = {};
        cols.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
      setRows(mapped);
      setPage(p);
    },
    [table.query],
  );

  const handleToggle = () => {
    if (!expanded) {
      loadPage(0);
    }
    setExpanded(!expanded);
  };

  const totalPages = count != null ? Math.ceil(count / 20) : 0;

  return (
    <Box sx={{ borderBottom: "1px solid #eee" }}>
      <Box
        onClick={handleToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 0.75,
          px: 0.5,
          cursor: "pointer",
          "&:hover": { backgroundColor: "#fafafa" },
        }}
      >
        <StorageIcon sx={{ fontSize: 16, color: "#999" }} />
        <Typography sx={{ fontSize: "0.85rem", fontWeight: "bold", flex: 1 }}>
          {table.displayName}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "#666",
            backgroundColor: "#f0f0f0",
            px: 0.75,
            py: 0.1,
            borderRadius: "0.25em",
          }}
        >
          {count ?? "..."}
        </Typography>
        {expanded ? (
          <ExpandLessIcon sx={{ fontSize: 16, color: "#999" }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 16, color: "#999" }} />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 0.5, pb: 1 }}>
          {rows.length === 0 ? (
            <Typography sx={{ fontSize: "0.8rem", color: "#999", py: 1, textAlign: "center" }}>
              No records
            </Typography>
          ) : (
            <>
              <Box
                sx={{
                  overflowX: "auto",
                  fontSize: "0.75rem",
                  "& table": { borderCollapse: "collapse", width: "100%", minWidth: 400 },
                  "& th, & td": {
                    p: "0.3em 0.5em",
                    borderBottom: "1px solid #eee",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                  "& th": { fontWeight: "bold", color: "#2a2a2a", backgroundColor: "#fafafa" },
                  "& tr:hover td": { backgroundColor: "#f5f5ff" },
                  "& tr": { cursor: "pointer" },
                }}
              >
                <table>
                  <thead>
                    <tr>
                      {table.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <>
                        <tr
                          key={`row-${idx}`}
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        >
                          {table.columns.map((col) => (
                            <td key={col}>{formatCellValue(row[col], col)}</td>
                          ))}
                        </tr>
                        {expandedRow === idx && (
                          <tr key={`detail-${idx}`}>
                            <td
                              colSpan={table.columns.length}
                              style={{ backgroundColor: "#fafafa", whiteSpace: "normal" }}
                            >
                              <Box sx={{ py: 0.5 }}>
                                {Object.entries(row).map(([key, value]) => (
                                  <Box
                                    key={key}
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      py: 0.25,
                                      borderBottom: "1px solid #f0f0f0",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "0.7rem",
                                        fontWeight: "bold",
                                        color: "#666",
                                        minWidth: 120,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {key}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: "0.7rem",
                                        color: "#2a2a2a",
                                        wordBreak: "break-all",
                                        maxHeight: 80,
                                        overflow: "auto",
                                      }}
                                    >
                                      {formatDetailValue(value, key)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}>
                  <Button
                    size="small"
                    disabled={page === 0}
                    onClick={() => loadPage(page - 1)}
                    sx={{ fontSize: "0.75rem", textTransform: "none", minWidth: "auto" }}
                  >
                    Prev
                  </Button>
                  <Typography sx={{ fontSize: "0.75rem", color: "#666", py: 0.5 }}>
                    Page {page + 1} of {totalPages}
                  </Typography>
                  <Button
                    size="small"
                    disabled={page >= totalPages - 1}
                    onClick={() => loadPage(page + 1)}
                    sx={{ fontSize: "0.75rem", textTransform: "none", minWidth: "auto" }}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function formatCellValue(value: unknown, col: string): string {
  if (value == null) return "—";
  if (col === "dataSize" || col === "size") return formatBytes(value as number);
  if (value instanceof Uint8Array) return `[${formatBytes(value.byteLength)}]`;
  if (typeof value === "string" && value.length > 50) return value.slice(0, 50) + "...";
  return String(value);
}

function formatDetailValue(value: unknown, key: string): string {
  if (value == null) return "null";
  if (value instanceof Uint8Array) return `Uint8Array(${formatBytes(value.byteLength)})`;
  if (key === "data" && typeof value === "string" && value.length > 200) {
    return `[${formatBytes(value.length)} of text data]`;
  }
  if (key === "content" && typeof value === "string" && value.length > 500) {
    return value.slice(0, 500) + "...";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// === Main Page ===

export default function DiagnosticsPage() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const [dbInfo, setDbInfo] = useState<{
    sizeBytes: number;
    storageType: string;
    persisted: boolean;
    sqliteVersion: string;
  } | null>(null);
  const [browserStorage, setBrowserStorage] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const [vacuuming, setVacuuming] = useState(false);

  useEffect(() => {
    // Get SQLite database info
    sqlDb.getDatabaseInfo().then((info) => {
      sqlDb.sql<{ v: string }>`SELECT sqlite_version() as v`.then(([row]) => {
        setDbInfo({
          sizeBytes: info.databaseSizeBytes ?? 0,
          storageType: info.storageType ?? "unknown",
          persisted: info.persisted ?? false,
          sqliteVersion: row.v,
        });
      });
    });

    // Get browser storage estimate (supplementary)
    navigator.storage?.estimate().then((est) => {
      setBrowserStorage({ usage: est.usage ?? 0, quota: est.quota ?? 0 });
    });
  }, []);

  const handleResetSettings = async () => {
    if (!window.confirm("Reset all settings to defaults? This cannot be undone.")) return;
    await sqlDb.sql`DELETE FROM settings WHERE id = 1`;
    await initSettings();
    window.location.reload();
  };

  const handleVacuum = async () => {
    setVacuuming(true);
    try {
      await sqlDb.sql`VACUUM`;
      // Refresh size
      const info = await sqlDb.getDatabaseInfo();
      setDbInfo((prev) => prev ? { ...prev, sizeBytes: info.databaseSizeBytes ?? 0 } : prev);
    } finally {
      setVacuuming(false);
    }
  };

  const handleExportDb = async () => {
    try {
      const file = await sqlDb.getDatabaseFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aoyo-${new Date().toISOString().slice(0, 10)}.sqlite3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Failed to export database: ${e}`);
    }
  };

  const storagePercent =
    browserStorage && browserStorage.quota > 0
      ? Math.round((browserStorage.usage / browserStorage.quota) * 100)
      : 0;

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
        Diagnostics
      </Typography>

      {/* Storage Overview */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Storage
        </Typography>
        {dbInfo ? (
          <>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
                mb: 1.5,
                "& td": { p: "0.4em 0.75em", borderBottom: "1px solid #eee" },
                "& td:first-of-type": { fontWeight: "bold", color: "#2a2a2a", width: "50%" },
                "& td:last-child": { color: "#666" },
              }}
            >
              <tbody>
                <tr>
                  <td>Database file size</td>
                  <td>{formatBytes(dbInfo.sizeBytes)}</td>
                </tr>
                <tr>
                  <td>Storage backend</td>
                  <td>
                    SQLite {dbInfo.sqliteVersion} via {dbInfo.storageType.toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td>Persistent storage</td>
                  <td>
                    {dbInfo.persisted ? (
                      <span style={{ color: "#090" }}>Granted</span>
                    ) : (
                      <span style={{ color: "#c90" }}>Not persistent (can be enabled from the prompt on the dashboard)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </Box>

            {/* Browser storage context */}
            {browserStorage && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: "0.75rem", color: "#999", mb: 0.5 }}>
                  Browser origin storage estimate (includes all site data, not just this app)
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                  <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
                    {formatBytes(browserStorage.usage)} used of ~{formatBytes(browserStorage.quota)} available
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
                    {storagePercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={storagePercent}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    backgroundColor: "#eee",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: storagePercent > 80 ? "#c00" : "#999",
                    },
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>
            Loading storage info...
          </Typography>
        )}
      </Box>

      {/* Database Browser */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Database Browser
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1 }}>
          Click a table to browse its records. Click a row to see all fields.
        </Typography>
        {TABLES.map((table) => (
          <TableBrowser key={table.name} table={table} />
        ))}
      </Box>

      {/* App Information */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          App Information
        </Typography>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
            "& td": {
              p: "0.4em 0.75em",
              borderBottom: "1px solid #eee",
            },
            "& td:first-of-type": {
              fontWeight: "bold",
              color: "#2a2a2a",
              width: "40%",
            },
            "& td:last-child": { color: "#666", wordBreak: "break-all" },
          }}
        >
          <tbody>
            <tr>
              <td>Database engine</td>
              <td>SQLite {dbInfo?.sqliteVersion ?? "..."} (WASM via sqlocal)</td>
            </tr>
            <tr>
              <td>Database path</td>
              <td>aoyo.sqlite3 (OPFS)</td>
            </tr>
            <tr>
              <td>Browser</td>
              <td style={{ fontSize: "0.8rem" }}>{navigator.userAgent}</td>
            </tr>
            <tr>
              <td>Platform</td>
              <td>{navigator.platform}</td>
            </tr>
          </tbody>
        </Box>
      </Box>

      {/* Maintenance */}
      <Box sx={fieldsetSx}>
        <Typography component="h3" sx={sectionHeadingSx}>
          Maintenance
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button onClick={handleResetSettings} sx={ao3ButtonSx}>
            Reset Settings
          </Button>
          <Button onClick={handleVacuum} disabled={vacuuming} sx={ao3ButtonSx}>
            {vacuuming ? "Vacuuming..." : "Vacuum Database"}
          </Button>
          <Button onClick={handleExportDb} sx={ao3ButtonSx}>
            Export .sqlite3 File
          </Button>
        </Box>
        <Typography sx={{ fontSize: "0.75rem", color: "#999", mt: 1 }}>
          <strong>Reset Settings</strong> restores all global settings to defaults.{" "}
          <strong>Vacuum</strong> reclaims space after large deletes.{" "}
          <strong>Export</strong> downloads the raw database file for offline backup.
        </Typography>
      </Box>
    </Box>
  );
}
