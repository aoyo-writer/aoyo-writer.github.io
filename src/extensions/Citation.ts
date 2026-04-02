import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CitationView from "./CitationView";

export const Citation = Node.create({
  name: "citation",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      citeKey: { default: "" },
      entryId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="citation"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "citation",
        "data-cite-key": HTMLAttributes.citeKey,
        "data-entry-id": HTMLAttributes.entryId ?? "",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationView);
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-c": () => {
        document.dispatchEvent(new CustomEvent("open-citation-picker"));
        return true;
      },
    };
  },
});
