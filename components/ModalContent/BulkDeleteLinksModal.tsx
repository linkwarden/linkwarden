import React from "react";
import useLinkStore from "@/store/links";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";
import { useBulkDeleteLinks } from "@/hooks/store/links";
import toast from "react-hot-toast";

type Props = {
  onClose: Function;
};

export default function BulkDeleteLinksModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { selectedLinks, setSelectedLinks } = useLinkStore();

  const deleteLinksById = useBulkDeleteLinks();

  const deleteLink = async () => {
    const load = toast.loading(t("deleting"));

    await deleteLinksById.mutateAsync(
      selectedLinks.map((link) => link.id as number),
      {
        onSettled: (data, error) => {
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            setSelectedLinks([]);
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
        {selectedLinks.length === 1
          ? t("delete_link")
          : t("delete_links", { count: selectedLinks.length })}
      </p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>
          {selectedLinks.length === 1
            ? t("link_deletion_confirmation_message")
            : t("links_deletion_confirmation_message", {
                count: selectedLinks.length,
              })}
        </p>

        <div role="alert" className="alert alert-warning">
          <i className="bi-exclamation-triangle text-xl" />
          <span>{t("warning_irreversible")}</span>
        </div>

        <p>{t("shift_key_tip")}</p>

        <Button className="ml-auto" intent="destructive" onClick={deleteLink}>
          <i className="bi-trash text-xl" />
          {t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
