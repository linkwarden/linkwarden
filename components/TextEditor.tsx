import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { formatAvailable } from "@/lib/shared/formatStats";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import clsx from "clsx";
import usePermissions from "@/hooks/usePermissions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TipTapLink from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import MenuBar from "@/components/Editor/MenuBar";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";

type Props = {
  link?: LinkIncludingShortenedCollectionAndTags;
  className?: string;
  editable?: boolean;
};

export type TextEditorRef = {
  getEditor: () => any;
};

const TextEditor = forwardRef<TextEditorRef, Props>(
  ({ link, className, editable }, ref) => {
    const { t } = useTranslation();
    const [linkContent, setLinkContent] = useState("");

    const editor = useEditor({
      extensions: [
        Document.extend({
          content: "heading block*",
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        StarterKit.configure({
          document: false,
        }),
        Image,
        ListItem,
        Highlight,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TipTapLink.configure({
          openOnClick: false,
        }),
        Placeholder.configure({
          placeholder: ({ node }: any) => {
            if (node.type.name === "heading") {
              return t("add_a_title_placeholder");
            }

            return t("write_notes_here_placeholder");
          },
        }),
      ],
      immediatelyRender: false,
      content: linkContent || `<h1>${link?.name || ""}</h1>\n<p></p>`,
      editable: editable || false,
      editorProps: {
        attributes: {
          class: clsx(
            "w-full h-[calc(80vh-10.75rem)] reader-view rounded-md bg-base-200 focus:outline-none border-neutral-content focus:border-primary border-solid border p-3 overflow-auto duration-100"
          ),
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }));

    const router = useRouter();
    const isPublicRoute = router.pathname.startsWith("/public");
    const permissions = link
      ? usePermissions(link.collection?.id as number)
      : true;

    useEffect(() => {
      const fetchLinkContent = async (
        l: LinkIncludingShortenedCollectionAndTags
      ) => {
        if (formatAvailable(l, "readable")) {
          const response = await fetch(
            `/api/v1/archives/${l?.id}?format=${ArchivedFormat.readability}&_=${l.updatedAt}`
          );
          const data = await response?.json();
          const content = data?.content || "";
          const combinedContent = `<h1>${l.name}</h1>\n${content}`;
          setLinkContent(combinedContent);
        }
      };

      if (link) {
        fetchLinkContent(link);
      }
    }, [link]);

    useEffect(() => {
      const a = editor?.getText();
      console.log(a);
    }, [editable, editor]);

    return (
      editor && (
        <div className={clsx(className)}>
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      )
    );
  }
);

export default TextEditor;
