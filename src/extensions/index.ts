import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { MathInline } from "./MathInline";
import { MathBlock } from "./MathBlock";
import { Citation } from "./Citation";
import { SourceRef } from "./SourceRef";
import type { Extensions } from "@tiptap/core";

/** Shared base extensions used by both editor and export. */
function baseExtensions(): Extensions {
  return [
    StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Image,
    Highlight,
    TaskList,
    TaskItem.configure({ nested: true }),
    Superscript,
    Subscript,
    MathInline,
    MathBlock,
    Citation,
    SourceRef,
  ];
}

/** Extensions for the TipTap editor (includes Placeholder). */
export function getEditorExtensions(placeholderText = "Start writing..."): Extensions {
  return [
    ...baseExtensions(),
    Placeholder.configure({ placeholder: placeholderText }),
  ];
}

/** Extensions for HTML generation (export/preview). No Placeholder needed. */
export function getExportExtensions(): Extensions {
  return baseExtensions();
}
