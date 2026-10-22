import React from "react";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { Separator } from "../ui/separator";

type Props = {
  onClose: Function;
  url: string;
};

export default function DangerousLinkWarningModal({ onClose, url }: Props) {
  const { t } = useTranslation();

  const preview = url.length > 300 ? url.slice(0, 300) + "…" : url;

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {t("script_link_warning_title")}
      </p>
      <Separator className="mb-3 mt-1" />

      <p className="text-sm">{t("script_link_warning_desc")}</p>

      <p className="mt-3 text-xs break-all font-mono bg-base-200 rounded-md p-2 max-h-28 overflow-auto">
        {preview}
      </p>

      <div className="w-full flex items-center justify-end gap-2 mt-3">
        <Button
          variant="ghost"
          className="hover:bg-base-200"
          onClick={() => onClose()}
        >
          {t("cancel")}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            window.open(url, "_blank");
            onClose();
          }}
        >
          {t("script_link_warning_run")}
        </Button>
      </div>
    </Modal>
  );
}
