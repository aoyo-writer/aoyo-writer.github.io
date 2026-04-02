import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InputRule } from "@tiptap/core";
import MathBlockView from "./MathBlockView";

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mathBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "mathBlock",
        "data-latex": HTMLAttributes.latex,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },

  addInputRules() {
    return [
      new InputRule({
        // Match $$ at start of line to create a block math node
        find: /^\$\$\s$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const node = this.type.create({ latex: "" });
          tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },
});
