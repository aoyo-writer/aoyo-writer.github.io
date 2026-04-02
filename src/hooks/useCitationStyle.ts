import { createContext, useContext } from "react";
import type { CitationStyle } from "../types";

/** Provides the active work's citation style to the component tree. */
export const CitationStyleContext = createContext<CitationStyle>("apa");

export interface FootnoteInfo {
  /** 1-based footnote number in document order. */
  index: number;
  /** Whether this is the first occurrence of this entryId in the document. */
  isFirst: boolean;
}

/**
 * Map from document position (from getPos()) to footnote info.
 * Recomputed on every doc change in WorkEditorPage.
 */
export const FootnoteMapContext = createContext<Map<number, FootnoteInfo>>(
  new Map(),
);

export function useCitationStyle(): CitationStyle {
  return useContext(CitationStyleContext);
}

export function useFootnoteMap(): Map<number, FootnoteInfo> {
  return useContext(FootnoteMapContext);
}
