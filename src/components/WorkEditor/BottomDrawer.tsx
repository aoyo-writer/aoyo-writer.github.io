import { Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";

interface BottomDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  fullPageUrl?: string;
}

export default function BottomDrawer({
  open,
  title,
  onClose,
  children,
  fullPageUrl,
}: BottomDrawerProps) {
  if (!open) return null;

  return (
    <Box
      sx={{
        borderTop: "2px solid #900",
        backgroundColor: "#fff",
        height: 300,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 0.5,
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f9f9f9",
          flexShrink: 0,
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1em",
            fontWeight: "normal",
            color: "#2a2a2a",
          }}
        >
          {title}
        </Typography>
        {fullPageUrl && (
          <Link
            to={fullPageUrl}
            style={{
              fontSize: "0.7rem",
              color: "#900",
              textDecoration: "none",
            }}
          >
            Open full page
          </Link>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 16, color: "#666" }} />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", p: 1.5 }}>{children}</Box>
    </Box>
  );
}
