import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import App from "./App";
import { initSettings } from "./db/sqlite";
import { migrateFromDexie } from "./db/migrate";

async function boot() {
  // Initialize SQLite schema (tables created via onInit in sqlite.ts)
  await initSettings();
  // Migrate from Dexie/IndexedDB if needed (one-time, no-op if already done)
  await migrateFromDexie();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

boot();
