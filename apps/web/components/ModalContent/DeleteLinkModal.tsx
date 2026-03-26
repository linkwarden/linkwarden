import React, { useEffect, useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import Modal from "../Modal";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { useDeleteLink } from "@linkwarden/router/links";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function DeleteLinkModal({ onClose, activeLink }: Props) {
  const { t } = useTranslation();
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  const deleteLink = useDeleteLink({ toast, t });
  const router = useRouter();

  useEffect(() => {
    setLink(activeLink);
  }, []);

  const submit = async () => {
    deleteLink.mutateAsync(link.id as number);

    if (
      router.pathname.startsWith("/links/[id]") ||
      router.pathname.startsWith("/preserved/[id]")
    ) {
      router.push("/dashboard");
    }
    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_link")}</p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>{t("link_deletion_confirmation_message")}</p>

        <div role="alert" className="alert alert-info">
          <i className="bi-info-circle text-xl" />
          <span>
            <b>{t("tip")}:</b> {t("shift_key_tip")}
          </span>
        </div>

        <Button className="ml-auto" variant="destructive" onClick={submit}>
          <i className="bi-trash text-xl" />
          {t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
