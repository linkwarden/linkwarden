import { Editor } from "@tiptap/react";
import IconButton from "./MenuIconButton";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap overflow-x-auto hide-scrollbar gap-1 mb-2">
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        icon="bi bi-type-h1"
        title="Heading 1"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon="bi bi-type-h2"
        title="Heading 2"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        icon="bi bi-type-h3"
        title="Heading 3"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon="bi bi-type-bold"
        title="Bold"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon="bi bi-type-italic"
        title="Italic"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        icon="bi bi-type-strikethrough"
        title="Strike"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        icon="bi bi-highlighter"
        title="Highlight"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        icon="bi bi-text-left"
        title="Align Left"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        icon="bi bi-text-center"
        title="Align Center"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        icon="bi bi-text-right"
        title="Align Right"
      />
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editor.isActive({ textAlign: "justify" })}
        icon="bi bi-justify"
        title="Align Justify"
      />
      <IconButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon="bi bi-list-ul"
        title="Bullet List"
      />
      <IconButton
        onClick={() => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: " " }],
                    },
                  ],
                },
              ],
            })
            .run();
        }}
        isActive={false} // Task insertion isn't a toggle action
        icon="bi bi-check2-square" // Choose an appropriate Bootstrap icon
        title="Insert Task"
      />

      <IconButton
        onClick={() => {
          const url = window.prompt("Enter image URL");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        isActive={false}
        icon="bi bi-image"
        title="Insert Image"
      />
    </div>
  );
};

export default MenuBar;
