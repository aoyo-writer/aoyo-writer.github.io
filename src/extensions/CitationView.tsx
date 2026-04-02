import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useSqlQuery } from "../db/sqlite";
import { formatAPAInText } from "../utils/apa";
import { formatOSCOLAFootnote, formatOSCOLAShort } from "../utils/oscola";
import { useCitationStyle, useFootnoteMap } from "../hooks/useCitationStyle";
import type { BibliographyEntry } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function deserializeBibEntry(row: Row): BibliographyEntry {
  return {
    id: row.id,
    workId: row.workId,
    citeKey: row.citeKey,
    entryType: row.entryType,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journal: row.journal ?? undefined,
    volume: row.volume ?? undefined,
    pages: row.pages ?? undefined,
    publisher: row.publisher ?? undefined,
    url: row.url ?? undefined,
    doi: row.doi ?? undefined,
    abstract: row.abstract ?? undefined,
    raw: row.raw,
    createdAt: row.createdAt,
  };
}

export default function CitationView({ node, getPos }: NodeViewProps) {
  const citationStyle = useCitationStyle();
  const footnoteMap = useFootnoteMap();

  const entryId = node.attrs.entryId;
  const rows = useSqlQuery<Row>(
    (sql) => sql`SELECT * FROM bibliography WHERE id = ${entryId ?? -1}`,
    [entryId],
  );
  const entry = rows?.[0] ? deserializeBibEntry(rows[0]) : undefined;

  if (citationStyle === "oscola") {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    const info = pos != null ? footnoteMap.get(pos) : undefined;
    const footnoteNum = info?.index ?? "?";
    const tooltipText = entry
      ? info?.isFirst
        ? formatOSCOLAFootnote(entry).replace(/<[^>]*>/g, "")
        : formatOSCOLAShort(entry).replace(/<[^>]*>/g, "")
      : node.attrs.citeKey || "?";

    return (
      <NodeViewWrapper as="span" style={{ display: "inline" }}>
        <sup
          style={{
            color: "#990000",
            cursor: "default",
            fontSize: "0.75em",
            fontWeight: "bold",
          }}
          title={tooltipText}
        >
          {footnoteNum}
        </sup>
      </NodeViewWrapper>
    );
  }

  // APA style: inline (Author, Year)
  const display = entry
    ? formatAPAInText(entry)
    : `(${node.attrs.citeKey || "?"})`;

  return (
    <NodeViewWrapper as="span" style={{ display: "inline" }}>
      <span
        style={{
          color: "#990000",
          cursor: "default",
          borderBottom: "1px dotted #990000",
        }}
        title={entry ? entry.title : node.attrs.citeKey}
      >
        {display}
      </span>
    </NodeViewWrapper>
  );
}
