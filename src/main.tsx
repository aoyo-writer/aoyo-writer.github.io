import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import App from "./App";
import { initSettings } from "./db/sqlite";
import { migrateFromDexie } from "./db/migrate";

/**
 * Wait for cross-origin isolation before booting.
 * mini-coi.js service worker adds COEP/COOP headers, but after a hard
 * refresh the browser bypasses the SW for the document request. This
 * detects that case and reloads so the SW can intercept properly.
 */
async function ensureCrossOriginIsolation(): Promise<void> {
  if (crossOriginIsolated) return;

  // If SW is registered but not controlling this page (hard refresh),
  // reload so the SW can intercept the document request.
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg?.active && !navigator.serviceWorker.controller) {
    location.reload();
    // Halt execution — reload is in progress
    await new Promise(() => {});
  }
}

async function boot() {
  await ensureCrossOriginIsolation();

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
