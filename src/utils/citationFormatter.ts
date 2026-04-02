import type { BibliographyEntry, CitationStyle } from "../types";
import { formatAPA, formatAPAInText } from "./apa";
import {
  formatOSCOLABibliography,
  formatOSCOLAFootnote,
  formatOSCOLAShort,
} from "./oscola";

/** Format a bibliography entry for the bibliography list (returns HTML). */
export function formatBibliographyEntry(
  entry: BibliographyEntry,
  style: CitationStyle,
): string {
  return style === "oscola"
    ? formatOSCOLABibliography(entry)
    : formatAPA(entry);
}

/** Format an inline/in-text citation display string. */
export function formatInTextCitation(
  entry: BibliographyEntry,
  style: CitationStyle,
): string {
  return style === "oscola"
    ? formatOSCOLAFootnote(entry)
    : formatAPAInText(entry);
}

/** Format a short subsequent citation (OSCOLA only; APA always uses same form). */
export function formatShortCitation(
  entry: BibliographyEntry,
  style: CitationStyle,
): string {
  return style === "oscola"
    ? formatOSCOLAShort(entry)
    : formatAPAInText(entry);
}
