import { PDFDocument } from "pdf-lib";

export interface PdfSource {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
}

export interface PageItem {
  id: string;
  sourceIndex: number;
  pageIndex: number;
  thumbnail: string;
}

let pdfWorkerReady = false;

async function ensurePdfWorker() {
  if (pdfWorkerReady) return;
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  pdfWorkerReady = true;
}

export async function loadPdf(file: File): Promise<PdfSource> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes);
  return {
    name: file.name,
    bytes,
    pageCount: doc.getPageCount(),
  };
}

export async function renderPageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale = 0.3,
): Promise<string> {
  await ensurePdfWorker();
  const pdfjsLib = await import("pdfjs-dist");
  const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const page = await doc.getPage(pageIndex + 1); // PDF.js is 1-based
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx as object, viewport } as never).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

  doc.destroy();
  return dataUrl;
}

export async function mergePdfs(
  sources: PdfSource[],
  pageOrder: Array<{ sourceIndex: number; pageIndex: number }>,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const loadedDocs = await Promise.all(
    sources.map((s) => PDFDocument.load(s.bytes)),
  );

  for (const { sourceIndex, pageIndex } of pageOrder) {
    const [copied] = await merged.copyPages(loadedDocs[sourceIndex], [pageIndex]);
    merged.addPage(copied);
  }

  return merged.save();
}
