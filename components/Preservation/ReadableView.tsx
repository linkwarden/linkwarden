import { formatAvailable } from "@/lib/shared/formatStats";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import DOMPurify from "dompurify";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import clsx from "clsx";
import LinkDate from "../LinkViews/LinkComponents/LinkDate";
import isValidUrl from "@/lib/shared/isValidUrl";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import usePermissions from "@/hooks/usePermissions";
import { useUpdateFile } from "@/hooks/store/links";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TipTapLink from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import MenuBar from "../Editor/MenuBar";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import ListItem from "@tiptap/extension-list-item";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  isExpanded: boolean;
  standalone: boolean;
};

export default function ReadableView({ link, isExpanded, standalone }: Props) {
  const { t } = useTranslation();
  const [linkContent, setLinkContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const editor = useEditor({
    extensions: [
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      StarterKit,
      Image,
      ListItem,
      Highlight,
      TextAlign,
      TipTapLink.configure({
        openOnClick: false,
      }),
    ],
    immediatelyRender: false,
    content: linkContent || "<p></p>",
    editable: false,
    editorProps: {
      attributes: {
        class: clsx(
          "rounded-md focus:outline-none border-neutral-content focus:border-primary border-solid border p-3 overflow-auto duration-100",
          isExpanded
            ? "h-[calc(100vh-7.25rem)]"
            : standalone
              ? "h-[calc(100vh-10.75rem)]"
              : "h-[calc(80vh-10.75rem)]"
        ),
      },
    },
  });

  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");
  const permissions = usePermissions(link?.collection?.id as number);

  useEffect(() => {
    const fetchLinkContent = async () => {
      if (formatAvailable(link, "readable")) {
        const response = await fetch(
          `/api/v1/archives/${link?.id}?format=${ArchivedFormat.readability}&_=${link.updatedAt}`
        );
        const data = await response?.json();
        setLinkContent(data?.content || "");
      }
    };

    fetchLinkContent();
  }, [link]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (!isEditing && linkContent && editor) {
      editor.commands.setContent(linkContent, false);
    }
  }, [linkContent, isEditing, editor]);

  const startEditing = () => {
    if (linkContent && editor) {
      editor.commands.setContent(linkContent, false);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (editor) {
      editor.commands.setContent(linkContent, false);
    }
    setIsEditing(false);
  };

  const updateFile = useUpdateFile();

  const saveChanges = () => {
    if (!editor) return;

    const updatedHTML = DOMPurify.sanitize(editor.getHTML());
    setLinkContent(updatedHTML);

    updateFile.mutate({
      linkId: link.id as number,
      file: new File([updatedHTML], "updatedContent.txt", {
        type: "text/plain",
      }),
    });
  };

  return (
    <div className="flex flex-col gap-3 items-start p-3 max-w-screen-lg mx-auto bg-base-200">
      {!isEditing && (
        <div className="flex gap-3 items-start">
          <div className="flex flex-col w-full gap-1">
            <p className="md:text-4xl text-2xl">
              {unescapeString(
                link?.name || link?.description || link?.url || ""
              )}
            </p>
            {link?.url && (
              <Link
                href={link?.url || ""}
                title={link?.url}
                target="_blank"
                className="hover:opacity-60 duration-100 break-all text-sm flex items-center gap-1 text-neutral w-fit"
              >
                <i className="bi-link-45deg" />
                {isValidUrl(link?.url || "") &&
                  new URL(link?.url as string).host}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-neutral flex justify-between w-full gap-2">
        <LinkDate link={link} />
        {!isPublicRoute && (permissions === true || permissions?.canUpdate) && (
          <>
            {!isEditing && linkContent ? (
              <button
                className="flex items-center gap-2 btn btn-ghost btn-sm"
                onClick={startEditing}
              >
                <i className="bi-pencil" />
                {t("edit")}
              </button>
            ) : linkContent ? (
              <div
                className={clsx(
                  "flex items-center gap-2",
                  isExpanded && "mr-10"
                )}
              >
                <button
                  className="flex items-center gap-2 btn btn-ghost btn-square btn-sm"
                  onClick={cancelEditing}
                >
                  <i className="bi-x text-xl" />
                </button>
                <button
                  className="flex items-center gap-2 btn btn-primary btn-square btn-sm"
                  onClick={() => {
                    saveChanges();
                    setIsEditing(false);
                  }}
                >
                  <i className="bi-check2 text-xl" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {link?.readable?.startsWith("archives") ? (
        <>
          {linkContent ? (
            <>
              {editor && isEditing ? (
                <div className="w-full reader-view">
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              ) : (
                <div
                  className={clsx(
                    "p-3 rounded-md w-full",
                    linkContent && "bg-base-200"
                  )}
                >
                  <div
                    className="line-break px-1 reader-view read-only"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(linkContent),
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-5 m-auto w-full flex flex-col items-center gap-5">
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
            </div>
          )}
        </>
      ) : (
        <div className={`w-full h-full flex flex-col justify-center`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="w-1/4 min-w-[7rem] max-w-[15rem] h-auto mx-auto mb-5"
            viewBox="0 0 16 16"
          >
            <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.598.598 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.598.598 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.598.598 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535L7.733.063z" />
            <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.598.598 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.659z" />
          </svg>
          <p className="text-center text-2xl">
            {t("link_preservation_in_queue")}
          </p>
          <p className="text-center text-lg mt-2">{t("check_back_later")}</p>
        </div>
      )}
    </div>
  );
}
