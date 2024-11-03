import React, { useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useBulkEditLinks } from "@/hooks/store/links";

type Props = {
  onClose: Function;
};

export default function BulkEditLinksModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { selectedLinks, setSelectedLinks } = useLinkStore();
  const [submitLoader, setSubmitLoader] = useState(false);
  const [removePreviousTags, setRemovePreviousTags] = useState(false);
  const [updatedValues, setUpdatedValues] = useState<
    Pick<LinkIncludingShortenedCollectionAndTags, "tags" | "collectionId">
  >({ tags: [] });

  const updateLinks = useBulkEditLinks();
  const setCollection = (e: any) => {
    const collectionId = e?.value || null;
    setUpdatedValues((prevValues) => ({ ...prevValues, collectionId }));
  };

  const setTags = (e: any) => {
    const tags = e.map((tag: any) => ({ name: tag.label }));
    setUpdatedValues((prevValues) => ({ ...prevValues, tags }));
  };

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading(t("updating"));

      await updateLinks.mutateAsync(
        {
          links: selectedLinks,
          newData: updatedValues,
          removePreviousTags,
        },
        {
          onSettled: (data, error) => {
            setSubmitLoader(false);
            toast.dismiss(load);

            if (error) {
              toast.error(error.message);
            } else {
              setSelectedLinks([]);
              onClose();
              toast.success(t("updated"));
            }
          },
        }
      );
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">
        {selectedLinks.length === 1
          ? t("edit_link")
          : t("edit_links", { count: selectedLinks.length })}
      </p>
      <div className="divider mb-3 mt-1"></div>
      <div className="mt-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">{t("move_to_collection")}</p>
            <CollectionSelection
              showDefaultValue={false}
              onChange={setCollection}
              creatable={false}
            />
          </div>

          <div>
            <p className="mb-2">{t("add_tags")}</p>
            <TagSelection onChange={setTags} />
          </div>
        </div>
        <div className="sm:ml-auto w-1/2 p-3">
          <label className="flex items-center gap-2 ">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={removePreviousTags}
              onChange={(e) => setRemovePreviousTags(e.target.checked)}
            />
            {t("remove_previous_tags")}
          </label>
        </div>
      </div>

      <div className="flex justify-end items-center mt-5">
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
        >
          {t("save_changes")}
        </button>
      </div>
    </Modal>
  );
}
