import { Box, Typography, Link as MuiLink, useMediaQuery } from "@mui/material";

export default function Footer() {
  const isMobile = useMediaQuery("(max-width: 42em)");

  return (
    <Box
      component="footer"
      id="footer"
      sx={{
        backgroundColor: "#990000",
        color: "#fff",
        p: isMobile ? "1em" : "1em 3em",
      }}
    >
      <Box
        sx={{
          maxWidth: 980,
          mx: "auto",
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 2 : 4,
        }}
      >
        <Box sx={{ flex: "2 1 300px", minWidth: 200 }}>
          <Typography
            component="h3"
            sx={{
              fontFamily: "Georgia, serif",
              color: "#fff",
              fontSize: "1em",
              fontWeight: "normal",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            About AOYO
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.6, opacity: 0.9 }}>
            So, this is a tool thingy I wrote cus my friend wants to write their essays in AO3 font.
            It's all local — your data stays on your machine. I've included some handy tools for
            academic writing too, so feel free to use or not use. Hosting this costs me nothing,
            so use it however you want~
          </Typography>
        </Box>

        <Box sx={{ flex: "1 1 150px", minWidth: 150 }}>
          <Typography
            component="h3"
            sx={{
              fontFamily: "Georgia, serif",
              color: "#fff",
              fontSize: "1em",
              fontWeight: "normal",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            Links
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            <Box component="li" sx={{ mb: 0.25 }}>
              <MuiLink
                href="https://github.com/aoyo-writer/aoyo-writer.github.io"
                target="_blank"
                rel="noopener"
                sx={{
                  color: "#fff",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  "&:visited": { color: "#fff" },
                }}
              >
                GitHub Repo
              </MuiLink>
            </Box>
            <Box component="li" sx={{ mb: 0.25 }}>
              <MuiLink
                href="https://github.com/aoyo-writer/aoyo-writer.github.io/issues"
                target="_blank"
                rel="noopener"
                sx={{
                  color: "#fff",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  "&:visited": { color: "#fff" },
                }}
              >
                Request a Feature / Report a Bug
              </MuiLink>
            </Box>
            <Box component="li" sx={{ mb: 0.25 }}>
              <MuiLink
                href="https://github.com/aoyo-writer/aoyo-writer.github.io/blob/main/LICENSE"
                target="_blank"
                rel="noopener"
                sx={{
                  color: "#fff",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  "&:visited": { color: "#fff" },
                }}
              >
                MIT License
              </MuiLink>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: "1 1 200px", minWidth: 150 }}>
          <Typography
            component="h3"
            sx={{
              fontFamily: "Georgia, serif",
              color: "#fff",
              fontSize: "1em",
              fontWeight: "normal",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            Acknowledgments
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.6, opacity: 0.9 }}>
            Design inspired by{" "}
            <MuiLink
              href="https://archiveofourown.org"
              target="_blank"
              rel="noopener"
              sx={{ color: "#ffcccc", textDecoration: "underline", "&:visited": { color: "#ffcccc" } }}
            >
              AO3
            </MuiLink>
            . Not affiliated with the OTW. Thank you to all the open-source tools that made
            this possible — honestly can't imagine building it all from scratch.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
