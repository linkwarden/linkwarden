import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useTranslation } from "next-i18next";
import { useDeleteLink } from "@/hooks/store/links";
import LinkDetails from "../LinkDetails";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/router";
import { dropdownTriggerer } from "@/lib/client/utils";
import toast from "react-hot-toast";
import clsx from "clsx";
import Modal from "../Modal";
import useWindowDimensions from "@/hooks/useWindowDimensions";

type Props = {
  onClose: Function;
  onDelete: Function;
  onUpdateArchive: Function;
  onPin: Function;
  link: LinkIncludingShortenedCollectionAndTags;
  activeMode?: "view" | "edit";
};

export default function LinkModal({
  onClose,
  onDelete,
  onUpdateArchive,
  onPin,
  link,
  activeMode,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const deleteLink = useDeleteLink();

  const [mode, setMode] = useState<"view" | "edit">(activeMode || "view");

  return (
    <Modal toggleModal={onClose} isLinkModal>
      <LinkDetails
        activeLink={link}
        className="sm:mt-0 -mt-11"
        mode={mode}
        setMode={(mode: "view" | "edit") => setMode(mode)}
        onUpdateArchive={onUpdateArchive}
        onClose={onClose}
      />
    </Modal>
  );
}
