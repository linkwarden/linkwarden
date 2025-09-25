import React, { useState } from "react";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";
import { useMergeTags } from "@linkwarden/router/tags";
import TextInput from "../TextInput";

type Props = {
  onClose: Function;
  selectedTags: number[];
  setSelectedTags: (tags: number[]) => void;
};

export default function MergeTagsModal({
  onClose,
  selectedTags,
  setSelectedTags,
}: Props) {
  const { t } = useTranslation();

  const [newTagName, setNewTagName] = useState("");

  const mergeTags = useMergeTags();

  const merge = async () => {
    const load = toast.loading(t("merging"));

    await mergeTags.mutateAsync(
      {
        tagIds: selectedTags,
        newTagName,
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
      <p className="text-xl font-thin">
        {t("merge_count_tags", { count: selectedTags.length })}
      </p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>{t("rename_tag_instruction")}</p>

        <TextInput
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder={t("tag_name_placeholder")}
        />

        <Button className="ml-auto" variant="accent" onClick={merge}>
          <i className="bi-intersect text-xl" />
          {t("merge_tags")}
        </Button>
      </div>
    </Modal>
  );
}
