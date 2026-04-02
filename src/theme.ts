import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#990000",
      dark: "#700000",
      light: "#bb0000",
    },
    secondary: {
      main: "#666666",
    },
    error: {
      main: "#990000",
      light: "#efd1d1",
    },
    warning: {
      main: "#d89e36",
      light: "#ffe34e",
    },
    info: {
      main: "#5998d6",
      light: "#d1e1ef",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#2a2a2a",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily:
      "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Helvetica, sans-serif",
    h1: {
      fontFamily: "Georgia, serif",
      fontSize: "2em",
      fontWeight: "normal",
    },
    h2: {
      fontFamily: "Georgia, serif",
      fontSize: "1.5em",
      fontWeight: "normal",
    },
    h3: {
      fontFamily: "Georgia, serif",
      fontSize: "1.286em",
      fontWeight: "normal",
    },
    h4: {
      fontFamily: "Georgia, serif",
      fontSize: "1.145em",
      fontWeight: "normal",
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontSize: "0.875rem",
          color: "#2a2a2a",
          backgroundColor: "#ffffff",
        },
        a: {
          color: "#990000",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
          "&:visited": {
            color: "#990000",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "0.25em",
          fontFamily:
            "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Helvetica, sans-serif",
          fontSize: "0.875rem",
          padding: "0.25em 0.75em",
          minWidth: "auto",
        },
      },
    },
  },
});

export default theme;
