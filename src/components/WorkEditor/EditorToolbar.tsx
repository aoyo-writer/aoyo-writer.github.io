import { Box, IconButton, Tooltip, Divider } from "@mui/material";
import type { Editor } from "@tiptap/react";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CodeIcon from "@mui/icons-material/Code";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import SuperscriptIcon from "@mui/icons-material/Superscript";
import SubscriptIcon from "@mui/icons-material/Subscript";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TableChartIcon from "@mui/icons-material/TableChart";
import ImageIcon from "@mui/icons-material/Image";
import FunctionsIcon from "@mui/icons-material/Functions";
import FormatQuoteOutlinedIcon from "@mui/icons-material/FormatQuoteOutlined";
import BorderColorIcon from "@mui/icons-material/BorderColor";

interface EditorToolbarProps {
  editor: Editor | null;
  collapsed: boolean;
}

const btnSx = {
  color: "#2a2a2a",
  borderRadius: "2px",
  p: "3px",
  "&:hover": { backgroundColor: "#eee" },
  "&.active": { backgroundColor: "#ddd", color: "#900" },
};

function ToolBtn({
  icon,
  tooltip,
  active,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          className={active ? "active" : ""}
          sx={btnSx}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function HeadingBtn({
  level,
  editor,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  editor: Editor;
}) {
  return (
    <Tooltip title={`Heading ${level}`} arrow placement="top">
      <span>
        <IconButton
          size="small"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level }).run()
          }
          className={
            editor.isActive("heading", { level }) ? "active" : ""
          }
          sx={{ ...btnSx, fontSize: "0.7rem", fontWeight: "bold", width: 24, height: 24 }}
        >
          H{level}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export default function EditorToolbar({
  editor,
  collapsed,
}: EditorToolbarProps) {
  if (!editor) return null;

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <Box
      sx={{
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f9f9f9",
        px: 0.5,
        py: 0.25,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Undo/Redo */}
      <ToolBtn
        icon={<UndoIcon sx={{ fontSize: 18 }} />}
        tooltip="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolBtn
        icon={<RedoIcon sx={{ fontSize: 18 }} />}
        tooltip="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Text formatting */}
      <ToolBtn
        icon={<FormatBoldIcon sx={{ fontSize: 18 }} />}
        tooltip="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolBtn
        icon={<FormatItalicIcon sx={{ fontSize: 18 }} />}
        tooltip="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolBtn
        icon={<FormatUnderlinedIcon sx={{ fontSize: 18 }} />}
        tooltip="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolBtn
        icon={<StrikethroughSIcon sx={{ fontSize: 18 }} />}
        tooltip="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolBtn
        icon={<SuperscriptIcon sx={{ fontSize: 18 }} />}
        tooltip="Superscript"
        active={editor.isActive("superscript")}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      />
      <ToolBtn
        icon={<SubscriptIcon sx={{ fontSize: 18 }} />}
        tooltip="Subscript"
        active={editor.isActive("subscript")}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      />

      {!collapsed && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

          {/* Headings */}
          {([1, 2, 3, 4] as const).map((level) => (
            <HeadingBtn key={level} level={level} editor={editor} />
          ))}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

          {/* Alignment */}
          <ToolBtn
            icon={<FormatAlignLeftIcon sx={{ fontSize: 18 }} />}
            tooltip="Align Left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          />
          <ToolBtn
            icon={<FormatAlignCenterIcon sx={{ fontSize: 18 }} />}
            tooltip="Align Center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          />
          <ToolBtn
            icon={<FormatAlignRightIcon sx={{ fontSize: 18 }} />}
            tooltip="Align Right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

          {/* Lists and blocks */}
          <ToolBtn
            icon={<FormatListBulletedIcon sx={{ fontSize: 18 }} />}
            tooltip="Bullet List"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolBtn
            icon={<FormatListNumberedIcon sx={{ fontSize: 18 }} />}
            tooltip="Ordered List"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolBtn
            icon={<ChecklistIcon sx={{ fontSize: 18 }} />}
            tooltip="Task List"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
          <ToolBtn
            icon={<FormatQuoteIcon sx={{ fontSize: 18 }} />}
            tooltip="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolBtn
            icon={<CodeIcon sx={{ fontSize: 18 }} />}
            tooltip="Code Block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <ToolBtn
            icon={<HorizontalRuleIcon sx={{ fontSize: 18 }} />}
            tooltip="Horizontal Rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

          {/* Insert */}
          <ToolBtn
            icon={<TableChartIcon sx={{ fontSize: 18 }} />}
            tooltip="Insert Table"
            onClick={insertTable}
          />
          <ToolBtn
            icon={<ImageIcon sx={{ fontSize: 18 }} />}
            tooltip="Insert Image"
            onClick={insertImage}
          />
          <ToolBtn
            icon={<FunctionsIcon sx={{ fontSize: 18 }} />}
            tooltip="Insert Math (Ctrl+Shift+M)"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({ type: "mathInline", attrs: { latex: "" } })
                .run()
            }
          />
          <ToolBtn
            icon={<FormatQuoteOutlinedIcon sx={{ fontSize: 18 }} />}
            tooltip="Insert Citation (Ctrl+Shift+C)"
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-citation-picker"),
              )
            }
          />
          <ToolBtn
            icon={<BorderColorIcon sx={{ fontSize: 18 }} />}
            tooltip="Source Reference (Ctrl+Shift+R)"
            active={editor.isActive("sourceRef")}
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent("open-source-ref-picker"),
              )
            }
          />
        </>
      )}
    </Box>
  );
}
