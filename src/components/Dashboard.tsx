import { Box, Typography, Button, Link as MuiLink } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useRecentWorks, usePinnedWorks, useWorkStats } from "../db/useWorks";

export default function Dashboard() {
  const navigate = useNavigate();
  const recentWorks = useRecentWorks(8);
  const pinnedWorks = usePinnedWorks();
  const stats = useWorkStats();

  const lastWork = recentWorks?.[0];

  return (
    <Box
      sx={{
        maxWidth: 980,
        mx: "auto",
        px: { xs: 1, sm: "3em" },
        py: "1em",
      }}
    >
      {/* Resume writing button */}
      {lastWork && (
        <Box
          sx={{
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "0.25em",
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>
              Continue where you left off
            </Typography>
            <Typography
              sx={{
                fontFamily: "Georgia, serif",
                fontSize: "1.2em",
                color: "#2a2a2a",
              }}
            >
              {lastWork.title}
            </Typography>
          </Box>
          <Button
            onClick={() => navigate(`/work/${lastWork.id}`)}
            sx={{
              background: "linear-gradient(#fff 2%, #ddd 95%, #bbb 100%)",
              border: "1px solid #bbb",
              color: "#2a2a2a",
              fontSize: "0.85rem",
              textTransform: "none",
              px: 2,
              "&:hover": {
                background: "linear-gradient(#fff 2%, #ccc 95%, #aaa 100%)",
              },
            }}
          >
            Resume Writing
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {/* Main column */}
        <Box sx={{ flex: 1 }}>
          {/* Recent works */}
          <Box sx={{ mb: 3 }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: "Georgia, serif",
                fontSize: "1.286em",
                fontWeight: "normal",
                mb: 1,
                borderBottom: "1px solid #ddd",
                pb: 0.5,
              }}
            >
              Recent Works
            </Typography>
            {!recentWorks || recentWorks.length === 0 ? (
              <Typography sx={{ fontSize: "0.9rem", color: "#666", py: 2 }}>
                No works yet.{" "}
                <Link
                  to="/work/new"
                  style={{ color: "#900", textDecoration: "none" }}
                >
                  Create your first work
                </Link>
                .
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {recentWorks.map((work) => (
                  <Box
                    component="li"
                    key={work.id}
                    sx={{
                      borderBottom: "1px solid #eee",
                      py: 0.75,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box>
                      <Link
                        to={`/work/${work.id}`}
                        style={{ color: "#900", textDecoration: "none" }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: "Georgia, serif",
                            fontSize: "1em",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {work.title}
                        </Typography>
                      </Link>
                      {work.subjects.length > 0 && (
                        <Typography
                          component="span"
                          sx={{ fontSize: "0.8rem", color: "#666", ml: 1 }}
                        >
                          {work.subjects.join(", ")}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        fontSize: "0.8rem",
                        color: "#666",
                        flexShrink: 0,
                      }}
                    >
                      <span>{work.wordCount.toLocaleString()} words</span>
                      <span>{work.status}</span>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Pinned works */}
          {pinnedWorks && pinnedWorks.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.286em",
                  fontWeight: "normal",
                  mb: 1,
                  borderBottom: "1px solid #ddd",
                  pb: 0.5,
                }}
              >
                Pinned
              </Typography>
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {pinnedWorks.map((work) => (
                  <Box
                    component="li"
                    key={work.id}
                    sx={{
                      borderBottom: "1px solid #eee",
                      py: 0.75,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Link
                      to={`/work/${work.id}`}
                      style={{ color: "#900", textDecoration: "none" }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "Georgia, serif",
                          fontSize: "1em",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {work.title}
                      </Typography>
                    </Link>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Stats sidebar */}
        <Box
          sx={{
            width: { xs: "100%", sm: 200 },
            minWidth: { sm: 200 },
          }}
        >
          <Box
            sx={{
              border: "1px solid #ddd",
              borderTop: "3px solid #900",
              p: 1.5,
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontFamily: "Georgia, serif",
                fontSize: "1.1em",
                fontWeight: "normal",
                mb: 1,
                borderBottom: "1px solid #eee",
                pb: 0.5,
              }}
            >
              Your Stats
            </Typography>
            {stats && (
              <Box
                component="dl"
                sx={{
                  m: 0,
                  "& dt": {
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    mt: 0.5,
                  },
                  "& dd": { m: 0, fontSize: "0.8rem", color: "#666" },
                }}
              >
                <dt>Total Works</dt>
                <dd>{stats.totalWorks}</dd>
                <dt>Total Words</dt>
                <dd>{stats.totalWords.toLocaleString()}</dd>
                <dt>Drafts</dt>
                <dd>{stats.byStatus.Draft}</dd>
                <dt>In Progress</dt>
                <dd>{stats.byStatus["In Progress"]}</dd>
                <dt>Final</dt>
                <dd>{stats.byStatus.Final}</dd>
                <dt>Archived</dt>
                <dd>{stats.byStatus.Archived}</dd>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <MuiLink
              component={Link}
              to="/works"
              sx={{
                color: "#900",
                fontSize: "0.85rem",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Browse all works &rarr;
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
