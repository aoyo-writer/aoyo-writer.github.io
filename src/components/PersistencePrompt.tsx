import { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";

const DISMISSED_KEY = "aoyo_persistence_dismissed";

export default function PersistencePrompt() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or already persistent
    if (localStorage.getItem(DISMISSED_KEY)) return;

    navigator.storage?.persisted?.().then((isPersisted) => {
      if (isPersisted) {
        setGranted(true);
        return;
      }
      // Show the prompt after a short delay so it doesn't flash on fast loads
      setTimeout(() => setShow(true), 1500);
    });
  }, []);

  const handleEnable = async () => {
    const result = await navigator.storage?.persist?.();
    if (result) {
      setGranted(true);
      setTimeout(() => setShow(false), 2000);
    } else {
      // Browser denied — dismiss silently, user can still use the app
      localStorage.setItem(DISMISSED_KEY, "1");
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 520,
        width: "calc(100% - 32px)",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "0.5em",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        p: 2,
        zIndex: 1300,
      }}
    >
      {granted ? (
        <Typography sx={{ fontSize: "0.85rem", color: "#090", textAlign: "center" }}>
          Persistent storage enabled. Your data is now protected from automatic cleanup.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
            <StorageIcon sx={{ fontSize: 24, color: "#900", mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: "bold", color: "#2a2a2a", mb: 0.5 }}>
                Protect your writing data
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.5 }}>
                AOYO stores your work locally in your browser. By default, browsers may
                clear this data automatically if your device runs low on storage space.
                Enabling persistent storage tells your browser to keep your data safe,
                so your writing is never lost unexpectedly.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: "0.75rem", color: "#999", mb: 1.5 }}>
            Without persistent storage, your data still works normally — the browser just
            doesn't guarantee it won't be cleaned up under extreme storage pressure.
            You can always export backups from the Backup page regardless of this setting.
          </Typography>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              onClick={handleDismiss}
              sx={{
                fontSize: "0.8rem",
                textTransform: "none",
                color: "#666",
                p: "0.2em 0.75em",
              }}
            >
              Not now
            </Button>
            <Button
              onClick={handleEnable}
              sx={{
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
              }}
            >
              Enable Persistent Storage
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
