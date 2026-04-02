import { useState } from "react";
import { Box, Typography, Link as MuiLink, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link } from "react-router-dom";
import type { Work } from "../../types";
import { getDeadlineStatus, isOverWordLimit } from "../../types";
import RequiredTags from "./RequiredTags";

interface WorkBlurbProps {
  work: Work;
}

function TagList({ label, tags }: { label: string; tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <Box component="li" sx={{ display: "block", mb: 0.25 }}>
      <Typography
        component="strong"
        sx={{ fontSize: "0.8rem", color: "#666", mr: 0.5, fontWeight: "bold" }}
      >
        {label}
      </Typography>
      {tags.map((tag, i) => (
        <Box key={tag} component="span">
          <MuiLink
            href="#"
            className="tag"
            sx={{
              fontSize: "0.8rem",
              color: "#111",
              textDecoration: "none",
              borderBottom: "1px dotted",
              lineHeight: 1.5,
              "&:hover": { backgroundColor: "#900", color: "#fff" },
            }}
          >
            {tag}
          </MuiLink>
          {i < tags.length - 1 && " "}
        </Box>
      ))}
    </Box>
  );
}

export default function WorkBlurb({ work }: WorkBlurbProps) {
  const [statsExpanded, setStatsExpanded] = useState(false);
  const deadlineStatus = getDeadlineStatus(work);
  const overLimit = isOverWordLimit(work);

  return (
    <Box
      component="li"
      sx={{
        display: "block",
        position: "relative",
        clear: "left",
        border: "1px solid #ddd",
        padding: "0.429em 0.75em",
        overflow: "visible",
        listStyle: "none",
        "&:after": {
          content: '" "',
          display: "block",
          height: 0,
          fontSize: 0,
          clear: "both",
          visibility: "hidden",
        },
      }}
    >
      {/* Required tags */}
      <Box sx={{ position: "absolute", top: "0.429em", width: 60 }}>
        <RequiredTags
          status={work.status}
          deadlineStatus={deadlineStatus}
          type={work.type}
          completionStatus={work.completionStatus}
        />
      </Box>

      {/* Header */}
      <Box sx={{ minHeight: 55, mb: "0.375em" }}>
        <Box sx={{ display: "block", m: "0.375em 5.25em 0 65px" }}>
          <Typography
            component="h4"
            sx={{
              fontSize: "1.143em",
              fontFamily: "Georgia, serif",
              fontWeight: 100,
              display: "inline",
            }}
          >
            <Link
              to={`/work/${work.id}`}
              style={{ color: "#900", textDecoration: "none" }}
            >
              {work.title}
            </Link>
          </Typography>
        </Box>

        {/* Subject tags (Fandom equivalent) */}
        <Box sx={{ display: "block", m: "0 5.25em 0 65px" }}>
          {work.subjects.map((s, i) => (
            <span key={s}>
              <MuiLink
                href="#"
                className="tag"
                sx={{
                  fontSize: "0.85rem",
                  color: "#111",
                  textDecoration: "none",
                  borderBottom: "1px dotted",
                  "&:hover": { backgroundColor: "#900", color: "#fff" },
                }}
              >
                {s}
              </MuiLink>
              {i < work.subjects.length - 1 && " "}
            </span>
          ))}
        </Box>
      </Box>

      {/* Date */}
      <Typography
        sx={{
          position: "absolute",
          top: "0.429em",
          right: "0.75em",
          fontSize: "0.8rem",
          color: "#666",
          m: 0,
        }}
      >
        {new Date(work.updatedAt).toLocaleDateString()}
      </Typography>

      {/* Tags */}
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mb: 0.5 }}>
        {work.warnings.length > 0 && (
          <TagList label="Warnings:" tags={work.warnings} />
        )}
        <TagList label="Topics:" tags={work.topics} />
        <TagList label="Key Terms:" tags={work.keyTerms} />
        <TagList label="Tags:" tags={work.freeformTags} />
      </Box>

      {/* Summary */}
      {work.summary && (
        <Box
          component="blockquote"
          sx={{
            m: "0.643em auto",
            textAlign: "justify",
            fontSize: "0.85rem",
            color: "#2a2a2a",
            lineHeight: 1.5,
          }}
        >
          {work.summary}
        </Box>
      )}

      {/* Stats - compact with expand */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          mt: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            fontSize: "0.8rem",
            color: "#666",
            alignItems: "center",
          }}
        >
          <Box
            component="span"
            sx={{
              color: overLimit ? "#990000" : "#666",
              fontWeight: overLimit ? "bold" : "normal",
            }}
          >
            {work.wordCount.toLocaleString()} words
            {work.wordCountLimit &&
              ` / ${work.wordCountLimit.toLocaleString()}`}
          </Box>
          <span>{work.status}</span>
          <span>{work.completionStatus}</span>
        </Box>
        <IconButton
          size="small"
          onClick={() => setStatsExpanded(!statsExpanded)}
          sx={{ p: 0.25 }}
        >
          {statsExpanded ? (
            <ExpandLessIcon sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Box>

      <Collapse in={statsExpanded}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mt: 0.5,
            pt: 0.5,
            borderTop: "1px solid #eee",
            fontSize: "0.8rem",
            color: "#666",
          }}
        >
          <span>
            Created: {new Date(work.createdAt).toLocaleDateString()}
          </span>
          <span>
            Modified: {new Date(work.updatedAt).toLocaleDateString()}
          </span>
          <span>Type: {work.type}</span>
          <span>Mode: {work.chapterMode}</span>
          {work.deadline && (
            <Box
              component="span"
              sx={{
                color:
                  deadlineStatus === "overdue"
                    ? "#990000"
                    : deadlineStatus === "upcoming"
                      ? "#d6ab00"
                      : "#666",
                fontWeight:
                  deadlineStatus === "overdue" ? "bold" : "normal",
              }}
            >
              Deadline: {new Date(work.deadline).toLocaleDateString()}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
