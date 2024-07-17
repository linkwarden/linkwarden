import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useRouter } from "next/router";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function DeleteLinkModal({ onClose, activeLink }: Props) {
  const { t } = useTranslation();
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);
  const { removeLink } = useLinkStore();
  const router = useRouter();

  useEffect(() => {
    setLink(activeLink);
  }, []);

  const deleteLink = async () => {
    const load = toast.loading(t("deleting"));

    const response = await removeLink(link.id as number);

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("deleted"));
    } else {
      toast.error(response.data as string);
    }

    if (router.pathname.startsWith("/links/[id]")) {
      router.push("/dashboard");
    }

    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_link")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>{t("link_deletion_confirmation_message")}</p>

        <div role="alert" className="alert alert-warning">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <b>{t("warning")}:</b> {t("irreversible_warning")}
          </span>
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
