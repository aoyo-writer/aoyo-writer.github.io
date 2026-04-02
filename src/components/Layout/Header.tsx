import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";

type NavLink = { label: string; path: string };
type NavDropdown = { label: string; items: NavLink[] };
type NavItem = NavLink | NavDropdown;

function isNavLink(item: NavItem): item is NavLink {
  return "path" in item;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Browse", path: "/works" },
  { label: "Create", path: "/work/new" },
  {
    label: "Tools",
    items: [
      { label: "Research Library", path: "/tools/research" },
      { label: "PDF Tool", path: "/tools/pdf" },
      { label: "Backup & Import", path: "/tools/backup" },
      { label: "Diagnostics", path: "/tools/diagnostics" },
    ],
  },
  { label: "Settings", path: "/settings" },
];

export default function Header() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toolsMenu = navItems.find((n) => !isNavLink(n) && n.label === "Tools") as NavDropdown;

  return (
    <Box
      component="header"
      id="header"
      sx={{ fontSize: "0.875em", m: "0 0 1em", p: 0, position: "relative" }}
    >
      {/* Branding + search */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "0.375em",
        }}
      >
        <Box sx={{ p: "0.375em" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: "Georgia, serif",
                color: "#900",
                fontSize: "1.714em",
                lineHeight: "1.75em",
                m: 0,
                fontWeight: "normal",
              }}
            >
              AYO
              <Box
                component="sup"
                sx={{
                  fontSize: "0.583em",
                  fontStyle: "italic",
                  display: isMobile ? "none" : "inline",
                }}
              >
                {" "}
                Archive of Your Own
              </Box>
            </Typography>
          </Link>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search works..."
            variant="outlined"
            sx={{
              width: isMobile ? 120 : 180,
              "& .MuiOutlinedInput-root": {
                height: 26,
                fontSize: "0.85rem",
                borderRadius: "0.25em",
                backgroundColor: "#fff",
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ fontSize: 14, color: "#2a2a2a" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Box>

      {/* Primary nav */}
      <Box
        component="nav"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          backgroundColor: "#900",
          width: "100%",
          boxShadow:
            "inset 0 -6px 10px rgba(0,0,0,0.35), 1px 1px 3px -1px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          position: "relative",
          minHeight: 30,
        }}
      >
        {isMobile ? (
          <>
            <IconButton
              size="small"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              sx={{ color: "#fff", p: "0.429em 0.75em" }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            {mobileMenuOpen && (
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#ddd",
                  zIndex: 55,
                  boxShadow: "1px 1px 3px -1px #444",
                  p: "0.25em 0",
                }}
              >
                {navItems.map((item) =>
                  isNavLink(item) ? (
                    <Box
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      sx={{
                        borderBottom: "1px solid #888",
                        mx: "0.25em",
                        p: "0.75em 0.5em",
                        color: "#111",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      {item.label}
                    </Box>
                  ) : (
                    item.items!.map((sub) => (
                      <Box
                        key={sub.label}
                        onClick={() => {
                          navigate(sub.path);
                          setMobileMenuOpen(false);
                        }}
                        sx={{
                          borderBottom: "1px solid #888",
                          mx: "0.25em",
                          p: "0.75em 0.5em",
                          color: "#111",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        {sub.label}
                      </Box>
                    ))
                  ),
                )}
              </Box>
            )}
          </>
        ) : (
          <>
            <Box sx={{ width: "2em" }} />
            {navItems.map((item) =>
              isNavLink(item) ? (
                <Link
                  key={item.label}
                  to={item.path}
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    sx={{
                      color: "#fff",
                      p: "0.429em 0.75em",
                      fontSize: "1em",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    {item.label}
                  </Box>
                </Link>
              ) : (
                <Box key={item.label} sx={{ position: "relative" }}>
                  <Box
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      color: "#fff",
                      p: "0.429em 0.75em",
                      fontSize: "1em",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    {item.label}
                  </Box>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    slotProps={{
                      paper: {
                        sx: {
                          background:
                            "linear-gradient(to bottom, rgba(221,221,221,0.98), rgba(204,204,204,0.98))",
                          borderRadius: 0,
                          boxShadow: "1px 1px 3px -1px #444",
                          width: "20em",
                          p: "0.25em 0",
                        },
                      },
                    }}
                  >
                    {toolsMenu.items.map((sub, i) => (
                      <MenuItem
                        key={sub.label}
                        onClick={() => {
                          navigate(sub.path);
                          setAnchorEl(null);
                        }}
                        sx={{
                          fontSize: "1em",
                          color: "#111",
                          p: "0.75em 0.5em",
                          minHeight: "auto",
                          borderBottom:
                            i < toolsMenu.items.length - 1
                              ? "1px solid #888"
                              : "none",
                          mx: "0.25em",
                          "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
                        }}
                      >
                        {sub.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ),
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
