import React from "react";
import useLinkStore from "@/store/links";
import toast from "react-hot-toast";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
};

export default function BulkDeleteLinksModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { selectedLinks, setSelectedLinks, deleteLinksById } = useLinkStore();

  const deleteLink = async () => {
    const load = toast.loading(t("deleting"));

    const response = await deleteLinksById(
      selectedLinks.map((link) => link.id as number)
    );

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("deleted"));
      setSelectedLinks([]);
      onClose();
    } else toast.error(response.data as string);
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
