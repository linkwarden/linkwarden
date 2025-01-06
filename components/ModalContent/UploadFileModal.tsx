import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@/types/global";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useUploadFile } from "@/hooks/store/links";
import { PostLinkSchemaType } from "@/lib/shared/schemaValidation";
import { useConfig } from "@/hooks/store/config";

type Props = {
  onClose: Function;
};

export default function UploadFileModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { data: config } = useConfig();

  const initial = {
    name: "",
    description: "",
    type: "url",
    tags: [],
    collection: {
      id: undefined,
      name: "",
    },
  } as PostLinkSchemaType;

  const [link, setLink] = useState<PostLinkSchemaType>(initial);
  const [file, setFile] = useState<File>();

  const uploadFile = useUploadFile();
  const [submitLoader, setSubmitLoader] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const router = useRouter();
  const { data: collections = [] } = useCollections();

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = undefined;

    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label },
    });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return { name: e.label };
    });

    setLink({ ...link, tags: tagNames });
  };

  useEffect(() => {
    setOptionsExpanded(false);
    if (router.pathname.startsWith("/collections/") && router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      if (
        currentCollection &&
        currentCollection.ownerId &&
        router.asPath.startsWith("/collections/")
      )
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
  }, [router, collections]);

  const submit = async () => {
    if (!submitLoader && file) {
      let fileType: ArchivedFormat | null = null;
      let linkType: "url" | "image" | "monolith" | "pdf" | null = null;

      if (file?.type === "image/jpg" || file.type === "image/jpeg") {
        fileType = ArchivedFormat.jpeg;
        linkType = "image";
      } else if (file.type === "image/png") {
        fileType = ArchivedFormat.png;
        linkType = "image";
      } else if (file.type === "application/pdf") {
        fileType = ArchivedFormat.pdf;
        linkType = "pdf";
      }
      // else if (file.type === "text/html") {
      //   fileType = ArchivedFormat.monolith;
      //   linkType = "monolith";
      // }

      setSubmitLoader(true);

      const load = toast.loading(t("creating"));

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
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <div className="flex gap-2 items-start">
        <p className="text-xl font-thin">{t("upload_file")}</p>
      </div>
      <div className="divider mb-3 mt-1"></div>
      <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
        <div className="sm:col-span-3 col-span-5">
          <p className="mb-2">{t("file")}</p>
          <label className="btn h-10 btn-sm w-full border border-neutral-content hover:border-neutral-content flex justify-between">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="cursor-pointer custom-file-input"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </label>
          <p className="text-xs font-semibold mt-2">
            {t("file_types", {
              size: config?.MAX_FILE_BUFFER || 10,
            })}
          </p>
        </div>
        <div className="sm:col-span-2 col-span-5">
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
      </div>
      {optionsExpanded && (
        <div className="mt-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="mb-2">{t("name")}</p>
              <TextInput
                value={link.name}
                onChange={(e) => setLink({ ...link, name: e.target.value })}
                placeholder={t("example_link")}
                className="bg-base-200"
              />
            </div>
            <div>
              <p className="mb-2">{t("tags")}</p>
              <TagSelection
                onChange={setTags}
                defaultValue={link.tags?.map((e) => ({
                  value: e.id,
                  label: e.name,
                }))}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2">{t("description")}</p>
              <textarea
                value={unescapeString(link.description || "") || ""}
                onChange={(e) =>
                  setLink({ ...link, description: e.target.value })
                }
                placeholder={t("description_placeholder")}
                className="resize-none w-full h-32 rounded-md p-2 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mt-5">
        <div
          onClick={() => setOptionsExpanded(!optionsExpanded)}
          className={`rounded-md cursor-pointer btn btn-sm btn-ghost duration-100 flex items-center px-2 w-fit text-sm`}
        >
          <p>
            {optionsExpanded ? t("hide") : t("more")} {t("options")}
          </p>
        </div>
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
        >
          {t("upload_file")}
        </button>
      </div>
    </Modal>
  );
}
