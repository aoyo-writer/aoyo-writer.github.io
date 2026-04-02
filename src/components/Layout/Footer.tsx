import { Box, Typography, Link as MuiLink, useMediaQuery } from "@mui/material";

const footerColumns = [
  {
    title: "About the Archive",
    links: [
      "Site Map",
      "Diversity Statement",
      "Terms of Service",
      "DMCA Policy",
    ],
  },
  {
    title: "Contact Us",
    links: [
      "Policy Questions & Abuse Reports",
      "Technical Support & Feedback",
    ],
  },
  {
    title: "Development",
    links: ["otwarchive v0.9.x", "Known Issues", "GPL by the OTW"],
  },
];

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
        {footerColumns.map((col) => (
          <Box key={col.title} sx={{ flex: "1 1 200px", minWidth: 150 }}>
            <Typography
              component="h3"
              className="heading"
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
              {col.title}
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {col.links.map((link) => (
                <Box component="li" key={link} sx={{ mb: 0.25 }}>
                  <MuiLink
                    href="#"
                    sx={{
                      color: "#fff",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {link}
                  </MuiLink>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
