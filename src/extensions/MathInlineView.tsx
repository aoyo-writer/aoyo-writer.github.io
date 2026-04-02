import { NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import type { NodeViewProps } from "@tiptap/react";
import katex from "katex";

export default function MathInlineView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [editing, setEditing] = useState(!node.attrs.latex);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  let renderedHtml = "";
  if (node.attrs.latex) {
    try {
      renderedHtml = katex.renderToString(node.attrs.latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      renderedHtml = `<span style="color:#900">${node.attrs.latex}</span>`;
    }
  }

  return (
    <NodeViewWrapper as="span" style={{ display: "inline" }}>
      {editing ? (
        <input
          ref={inputRef}
          value={node.attrs.latex}
          onChange={(e) => updateAttributes({ latex: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              setEditing(false);
            }
          }}
          placeholder="LaTeX..."
          style={{
            fontFamily: "'Monaco', 'Consolas', Courier, monospace",
            fontSize: "0.85em",
            border: "1px solid #ddd",
            borderRadius: 2,
            padding: "1px 4px",
            background: "#f5f5f5",
            outline: "none",
            minWidth: 60,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            cursor: "pointer",
            borderBottom: selected ? "2px solid #990000" : "none",
            padding: "0 2px",
          }}
          dangerouslySetInnerHTML={{
            __html:
              renderedHtml ||
              '<em style="color:#aaa;font-size:0.85em">math</em>',
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
