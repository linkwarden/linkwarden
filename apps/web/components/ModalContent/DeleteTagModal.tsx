import React, { useEffect, useState } from "react";
import { TagIncludingLinkCount } from "@linkwarden/types";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";
import { useRemoveTag } from "@linkwarden/router/tags";

type Props = {
  onClose: Function;
  activeTag: TagIncludingLinkCount;
};

export default function DeleteTagModal({ onClose, activeTag }: Props) {
  const { t } = useTranslation();
  const [tag, setTag] = useState<TagIncludingLinkCount>(activeTag);

  const deleteTag = useRemoveTag();

  useEffect(() => {
    setTag(activeTag);
  }, []);

  const submit = async () => {
    const load = toast.loading(t("deleting"));

    await deleteTag.mutateAsync(tag.id as number, {
      onSettled: (data, error) => {
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("deleted"));
          onClose();
        }
      },
    });
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_tag")}</p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>{t("tag_deletion_confirmation_message")}</p>

        <Button className="ml-auto" variant="destructive" onClick={submit}>
          <i className="bi-trash text-xl" />
          {t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
