import { Box, Tooltip } from "@mui/material";
import type { WorkStatus, WorkType, CompletionStatus, DeadlineStatus } from "../../types";

interface RequiredTagsProps {
  status: WorkStatus;
  deadlineStatus: DeadlineStatus;
  type: WorkType;
  completionStatus: CompletionStatus;
}

const statusConfig: Record<WorkStatus, { label: string; bg: string }> = {
  Draft: { label: "D", bg: "#aaa" },
  "In Progress": { label: "IP", bg: "#d6ab00" },
  Final: { label: "F", bg: "#77a801" },
  Archived: { label: "A", bg: "#666" },
};

const deadlineConfig: Record<DeadlineStatus, { label: string; bg: string }> = {
  none: { label: "--", bg: "#ddd" },
  upcoming: { label: "!", bg: "#d6ab00" },
  overdue: { label: "!!", bg: "#990000" },
  met: { label: "\u2713", bg: "#77a801" },
};

const typeConfig: Record<WorkType, { label: string; bg: string }> = {
  Essay: { label: "Es", bg: "#2a6496" },
  "Research Paper": { label: "RP", bg: "#6a3d9a" },
  Story: { label: "St", bg: "#c26600" },
  Notes: { label: "Nt", bg: "#77a801" },
  Other: { label: "Ot", bg: "#aaa" },
};

const completionConfig: Record<CompletionStatus, { label: string; bg: string }> = {
  Complete: { label: "\u2713", bg: "#77a801" },
  "Work in Progress": { label: "WIP", bg: "#c26600" },
};

function TagCell({
  label,
  bg,
  tooltip,
}: {
  label: string;
  bg: string;
  tooltip: string;
}) {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: "block",
          width: 25,
          height: 25,
          backgroundColor: bg,
          color: bg === "#ddd" ? "#666" : "#fff",
          fontSize: "0.55rem",
          fontWeight: "bold",
          lineHeight: "25px",
          textAlign: "center",
          borderRadius: "2px",
          cursor: "default",
          overflow: "hidden",
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}

export default function RequiredTags({
  status,
  deadlineStatus,
  type,
  completionStatus,
}: RequiredTagsProps) {
  const sCfg = statusConfig[status];
  const dCfg = deadlineConfig[deadlineStatus];
  const tCfg = typeConfig[type];
  const cCfg = completionConfig[completionStatus];

  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
        position: "relative",
        width: 56,
        height: 53,
      }}
    >
      <Box component="li" sx={{ position: "absolute", top: 0, left: 0 }}>
        <TagCell label={sCfg.label} bg={sCfg.bg} tooltip={`Status: ${status}`} />
      </Box>
      <Box component="li" sx={{ position: "absolute", top: 28, left: 0 }}>
        <TagCell label={dCfg.label} bg={dCfg.bg} tooltip={`Deadline: ${deadlineStatus}`} />
      </Box>
      <Box component="li" sx={{ position: "absolute", top: 0, left: 28 }}>
        <TagCell label={tCfg.label} bg={tCfg.bg} tooltip={`Type: ${type}`} />
      </Box>
      <Box component="li" sx={{ position: "absolute", top: 28, left: 28 }}>
        <TagCell label={cCfg.label} bg={cCfg.bg} tooltip={completionStatus} />
      </Box>
    </Box>
  );
}
