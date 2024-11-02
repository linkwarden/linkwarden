import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import { useRouter } from "next/router";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useAddLink } from "@/hooks/store/links";
import toast from "react-hot-toast";
import { PostLinkSchemaType } from "@/lib/shared/schemaValidation";

type Props = {
  onClose: Function;
};

export default function NewLinkModal({ onClose }: Props) {
  const { t } = useTranslation();
  const initial = {
    name: "",
    url: "",
    description: "",
    type: "url",
    tags: [],
    collection: {
      id: undefined,
      name: "",
    },
  } as PostLinkSchemaType;

  const [link, setLink] = useState<PostLinkSchemaType>(initial);

  const addLink = useAddLink();

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
    const tagNames = e.map((e: any) => ({ name: e.label }));
    setLink({ ...link, tags: tagNames });
  };

  useEffect(() => {
    if (router.pathname.startsWith("/collections/") && router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
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
  }, []);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading(t("creating_link"));

      await addLink.mutateAsync(link, {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(t(error.message));
          } else {
            onClose();
            toast.success(t("link_created"));
          }
        },
      });
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("create_new_link")}</p>
      <div className="divider mb-3 mt-1"></div>
      <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
        <div className="sm:col-span-3 col-span-5">
          <p className="mb-2">{t("link")}</p>
          <TextInput
            value={link.url || ""}
            onChange={(e) => setLink({ ...link, url: e.target.value })}
            placeholder={t("link_url_placeholder")}
            className="bg-base-200"
          />
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
      <div className={"mt-2"}>
        {optionsExpanded && (
          <div className="mt-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="mb-2">{t("name")}</p>
                <TextInput
                  value={link.name}
                  onChange={(e) => setLink({ ...link, name: e.target.value })}
                  placeholder={t("link_name_placeholder")}
                  className="bg-base-200"
                />
              </div>
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
        >
          {t("create_link")}
        </button>
      </div>
    </Modal>
  );
}
