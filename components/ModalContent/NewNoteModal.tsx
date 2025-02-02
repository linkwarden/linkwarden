import React, { useEffect, useState, useRef } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import unescapeString from "@/lib/client/unescapeString";
import { useRouter } from "next/router";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useUploadFile } from "@/hooks/store/links";
import toast from "react-hot-toast";
import { PostLinkSchemaType } from "@/lib/shared/schemaValidation";
import TextEditor, { TextEditorRef } from "../TextEditor";
import DOMPurify from "dompurify";

type Props = {
  onClose: () => void;
};

export default function NewNoteModal({ onClose }: Props) {
  const { t } = useTranslation();
  const initial = {
    name: "",
    description: "",
    type: "readable",
    tags: [],
    collection: {
      id: undefined,
      name: "",
    },
  } as PostLinkSchemaType;

  const [link, setLink] = useState<PostLinkSchemaType>(initial);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const router = useRouter();
  const { data: collections = [] } = useCollections();

  const editorRef = useRef<TextEditorRef>(null);

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = undefined;
    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label },
    });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => ({ name: e.label }));
    setLink({ ...link, tags: tagNames });
  };

  useEffect(() => {
    if (router.pathname.startsWith("/collections/") && router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id === Number(router.query.id)
      );

      if (currentCollection && currentCollection.ownerId)
        setLink({
          ...initial,
          collection: {
            id: currentCollection.id,
            name: currentCollection.name,
          },
        });
    } else
      setLink({
        ...initial,
        collection: { name: "Unorganized" },
      });
  }, [router.pathname, router.query.id, collections]);

  const uploadFile = useUploadFile();

  const submit = async () => {
    if (submitLoader) return;
    setSubmitLoader(true);

    const load = toast.loading(t("creating_link"));

    try {
      const editor = editorRef.current?.getEditor();
      if (!editor) throw new Error("Editor not initialized");

      const sanitizedHTML = DOMPurify.sanitize(editor.getHTML());

      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedHTML, "text/html");

      const h1 = doc.querySelector("h1");
      const title = h1 ? h1.textContent?.trim() : link.name;

      if (h1) {
        h1.remove();
      }

      const contentWithoutTitle = doc.body.innerHTML || "";

      const file = new File([contentWithoutTitle], title || "Untitled Note", {
        type: "text/plain",
      });

      await uploadFile.mutateAsync(
        { link, file },
        {
          onSettled: (data, error) => {
            setSubmitLoader(false);
            toast.dismiss(load);

            if (error) {
              toast.error(error.message);
            } else {
              onClose();
              toast.success(t("created_success"));
            }
          },
        }
      );
    } catch (error: any) {
      setSubmitLoader(false);
      toast.dismiss(load);
      toast.error(error.message || "An error occurred");
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("write_new_note")}</p>
      <div className="divider mb-2 mt-1"></div>
      <TextEditor ref={editorRef} editable />
      <div className={"mt-2"}>
        {optionsExpanded && (
          <div className="mt-5">
            <div className="grid gap-3">
              <div>
                <p className="mb-2">{t("tags")}</p>
                <TagSelection
                  onChange={setTags}
                  defaultValue={link.tags?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                />
              </div>
              <div>
                <p className="mb-2">{t("collection")}</p>
                {link.collection?.name && (
                  <CollectionSelection
                    onChange={setCollection}
                    defaultValue={{
                      value: link.collection?.id,
                      label: link.collection?.name || "Unorganized",
                    }}
                  />
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2">{t("description")}</p>
                <textarea
                  value={unescapeString(link.description || "") || ""}
                  onChange={(e) =>
                    setLink({ ...link, description: e.target.value })
                  }
                  placeholder={t("link_description_placeholder")}
                  className="resize-none w-full h-32 rounded-md p-2 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-5">
        <div
          onClick={() => setOptionsExpanded(!optionsExpanded)}
          className={`rounded-md cursor-pointer btn btn-sm btn-ghost duration-100 flex items-center px-2 w-fit text-sm`}
        >
          <p>{optionsExpanded ? t("hide_options") : t("more_options")}</p>
          <i className={`bi-chevron-${optionsExpanded ? "up" : "down"}`}></i>
        </div>
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
          disabled={submitLoader}
        >
          {submitLoader ? t("creating...") : t("create_link")}
        </button>
      </div>
    </Modal>
  );
}
