import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useUploadFile } from "@linkwarden/router/links";
import { PostLinkSchemaType } from "@linkwarden/lib/schemaValidation";
import { useConfig } from "@linkwarden/router/config";
import { Button } from "@/components/ui/Button";

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
    collection: { id: undefined, name: "" },
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
    setLink({ ...link, collection: { id: e?.value, name: e?.label } });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => ({ name: e.label }));
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
      ) {
        setLink({
          ...initial,
          collection: {
            id: currentCollection.id,
            name: currentCollection.name,
          },
        });
      }
    } else {
      setLink({ ...initial, collection: { name: "Unorganized" } });
    }
  }, [router, collections]);

  const submit = async () => {
    if (!submitLoader && file) {
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
      <div className="divider mb-3 mt-1" />

      <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
        <div className="sm:col-span-3 col-span-5">
          <p className="mb-2">{t("file")}</p>
          <label className="h-10 cursor-pointer w-full border border-neutral-content bg-base-200 hover:bg-base-300 duration-150 rounded-md px-2 flex justify-between items-center">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="cursor-pointer custom-file-input w-full"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </label>
          <p className="text-xs font-semibold mt-2">
            {t("file_types", { size: config?.MAX_FILE_BUFFER || 10 })}
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
                className="resize-none w-full h-32 rounded-md p-2 border-neutral-content bg-base-200 focus:border-primary border outline-none duration-100"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-5">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center px-2 w-fit text-sm"
          onClick={() => setOptionsExpanded(!optionsExpanded)}
        >
          <p>{optionsExpanded ? t("hide_options") : t("more_options")}</p>
          <i className={`bi-chevron-${optionsExpanded ? "up" : "down"}`} />
        </Button>
        <Button variant="accent" onClick={submit}>
          {t("upload_file")}
        </Button>
      </div>
    </Modal>
  );
}
