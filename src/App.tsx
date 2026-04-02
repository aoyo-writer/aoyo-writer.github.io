import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Dashboard from "./components/Dashboard";
import WorkListPage from "./components/WorkListing/WorkListPage";
import NewWork from "./components/NewWork";
import WorkEditorPage from "./components/WorkEditor/WorkEditorPage";
import WorkSettings from "./components/WorkSettings";
import GlobalSettings from "./components/GlobalSettings";
import BackupPage from "./components/tools/BackupPage";
import PdfToolPage from "./components/tools/PdfToolPage";
import DiagnosticsPage from "./components/tools/DiagnosticsPage";
import ResearchPage from "./components/tools/ResearchPage";
import PersistencePrompt from "./components/PersistencePrompt";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/works" element={<WorkListPage />} />
          <Route path="/work/new" element={<NewWork />} />
          <Route path="/work/:id" element={<WorkEditorPage />} />
          <Route path="/work/:id/settings" element={<WorkSettings />} />
          <Route path="/settings" element={<GlobalSettings />} />
          <Route path="/tools/backup" element={<BackupPage />} />
          <Route path="/tools/pdf" element={<PdfToolPage />} />
          <Route path="/tools/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/tools/research" element={<ResearchPage />} />
        </Routes>
        <Footer />
        <PersistencePrompt />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
