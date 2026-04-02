import { NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import type { NodeViewProps } from "@tiptap/react";
import katex from "katex";

export default function MathBlockView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [editing, setEditing] = useState(!node.attrs.latex);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  let renderedHtml = "";
  if (node.attrs.latex) {
    try {
      renderedHtml = katex.renderToString(node.attrs.latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      renderedHtml = `<span style="color:#900">${node.attrs.latex}</span>`;
    }
  }

  return (
    <NodeViewWrapper>
      {editing ? (
        <div
          style={{
            margin: "0.5em 0",
            border: "1px solid #ddd",
            borderRadius: 4,
            backgroundColor: "#f5f5f5",
            padding: "0.5em",
          }}
        >
          <textarea
            ref={textareaRef}
            value={node.attrs.latex}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
              // Allow Shift+Enter for newlines, Enter alone commits
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setEditing(false);
              }
            }}
            placeholder="LaTeX (display mode)..."
            rows={3}
            style={{
              width: "100%",
              fontFamily: "'Monaco', 'Consolas', Courier, monospace",
              fontSize: "0.85em",
              border: "none",
              background: "transparent",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            cursor: "pointer",
            textAlign: "center",
            margin: "0.5em 0",
            padding: "0.5em",
            borderRadius: 4,
            border: selected ? "2px solid #990000" : "2px solid transparent",
          }}
          dangerouslySetInnerHTML={{
            __html:
              renderedHtml ||
              '<em style="color:#aaa">display math</em>',
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
