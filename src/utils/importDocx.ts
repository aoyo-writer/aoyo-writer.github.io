import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import { getExportExtensions } from "../extensions";

export interface DocxImportResult {
  json: JSONContent;
  warnings: string[];
}

/**
 * Import a .docx file and return TipTap-compatible JSON content.
 * Tries @docen/import-docx (direct TipTap JSON) first, falls back to mammoth (HTML).
 */
export async function importDocx(file: File): Promise<DocxImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const warnings: string[] = [];

  // Try @docen/import-docx first (outputs TipTap JSON directly)
  try {
    const { parseDOCX } = await import("@docen/import-docx");
    const json = await parseDOCX(new Uint8Array(arrayBuffer));
    return { json, warnings: [] };
  } catch (e) {
    warnings.push(`@docen/import-docx failed (${e}), falling back to mammoth`);
  }

  // Fallback: mammoth.js (outputs HTML)
  const mammoth = await import("mammoth");
  const result = await mammoth.default.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.default.images.imgElement(async (image) => {
        const buffer = await image.read();
        const base64 = arrayBufferToBase64(buffer as unknown as ArrayBuffer);
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    },
  );

  warnings.push(
    ...result.messages
      .filter((m) => m.type === "warning")
      .map((m) => m.message),
  );

  // Convert mammoth HTML to TipTap JSON
  const extensions = getExportExtensions();
  const json = generateJSON(result.value, extensions);

  return { json, warnings };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
