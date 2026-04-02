import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InputRule } from "@tiptap/core";
import MathInlineView from "./MathInlineView";

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="mathInline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "mathInline",
        "data-latex": HTMLAttributes.latex,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView);
  },

  addInputRules() {
    return [
      new InputRule({
        // Match $...$ but not $$ (which is block math)
        find: /(?<!\$)\$([^$\n]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex) return;
          const { tr } = state;
          const node = this.type.create({ latex });
          tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-m": () => {
        return this.editor
          .chain()
          .focus()
          .insertContent({ type: this.name, attrs: { latex: "" } })
          .run();
      },
    };
  },
});
