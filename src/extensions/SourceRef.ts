import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sourceRef: {
      setSourceRef: (attrs: { entryId: number; pageRef?: string }) => ReturnType;
      unsetSourceRef: () => ReturnType;
    };
  }
}

export const SourceRef = Mark.create({
  name: "sourceRef",

  addAttributes() {
    return {
      entryId: { default: null },
      pageRef: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-type="source-ref"]',
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            entryId: parseInt(el.dataset.entryId ?? "0") || null,
            pageRef: el.dataset.pageRef ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(HTMLAttributes, {
        "data-type": "source-ref",
        "data-entry-id": HTMLAttributes.entryId ?? "",
        "data-page-ref": HTMLAttributes.pageRef ?? "",
        class: "source-ref",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setSourceRef:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetSourceRef:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-r": () => {
        document.dispatchEvent(new CustomEvent("open-source-ref-picker"));
        return true;
      },
    };
  },
});
