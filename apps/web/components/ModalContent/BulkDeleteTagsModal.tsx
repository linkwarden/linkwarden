import React from "react";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";
import { useBulkTagDeletion } from "@linkwarden/router/tags";

type Props = {
  onClose: Function;
  selectedTags: number[];
  setSelectedTags: (tags: number[]) => void;
};

export default function BulkDeleteTagsModal({
  onClose,
  selectedTags,
  setSelectedTags,
}: Props) {
  const { t } = useTranslation();

  const deleteTagsById = useBulkTagDeletion();

  const deleteTag = async () => {
    const load = toast.loading(t("deleting"));

    await deleteTagsById.mutateAsync(
      {
        tagIds: selectedTags,
      },
      {
        onSettled: (data, error) => {
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            setSelectedTags([]);
            onClose();
            toast.success(t("deleted"));
          }
        },
      }
    );
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {selectedTags.length === 1
          ? t("delete_tag")
          : t("delete_tags", { count: selectedTags.length })}
      </p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>
          {selectedTags.length === 1
            ? t("tag_deletion_confirmation_message")
            : t("tags_deletion_confirmation_message", {
                count: selectedTags.length,
              })}
        </p>

        <Button className="ml-auto" variant="destructive" onClick={deleteTag}>
          <i className="bi-trash text-xl" />
          {t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
