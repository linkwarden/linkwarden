import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import Modal from "./Modal";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useTranslation } from "next-i18next";
import { BeatLoader } from "react-spinners";
import {
  useGenerateQRCode,
  useDeleteQRCode,
} from "@linkwarden/router/links";
import qrCodeFilename from "@linkwarden/lib/qrCodeFilename";
import toast from "react-hot-toast";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function QRCodeModal({ onClose, activeLink }: Props) {
  const { t } = useTranslation();
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const generateQR = useGenerateQRCode();
  const deleteQR = useDeleteQRCode();

  const qrCodeUrl = link.qrCode
    ? `/api/v1/links/${link.id}/qr?updatedAt=${link.updatedAt}`
    : null;

  const isGenerating = generateQR.isPending;
  const isDeleting = deleteQR.isPending;

  const handleGenerate = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const load = toast.loading(t("generating_qr_code"));
    try {
      const updated = await generateQR.mutateAsync(link.id as number);
      setLink(updated);
      toast.success(t("qr_code_generated"), { id: load });
    } catch (error: any) {
      toast.error(error.message || t("failed_to_generate_qr_code"), {
        id: load,
      });
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    const load = toast.loading(t("deleting_qr_code"));
    try {
      const updated = await deleteQR.mutateAsync(link.id as number);
      setLink(updated);
      setConfirmDelete(false);
      toast.success(t("qr_code_deleted"), { id: load });
    } catch (error: any) {
      toast.error(error.message || t("failed_to_delete_qr_code"), {
        id: load,
      });
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const anchor = document.createElement("a");
    anchor.href = qrCodeUrl;
    anchor.download = qrCodeFilename(link.url || "");
    anchor.click();
  };

  return (
    <Modal toggleModal={onClose}>
      <div data-ignore-click-away>
        <p className="text-xl font-thin">{t("qr_code")}</p>
        <Separator className="my-3" />

        <div className="flex flex-col gap-4 items-center">
          {qrCodeUrl ? (
          <>
            <div className="bg-white p-4 rounded-lg">
              <img
                src={qrCodeUrl}
                alt={t("qr_code")}
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-sm text-neutral text-center break-all">
              {link.url}
            </p>

            <div className="flex gap-2 flex-wrap justify-center">
              <Button variant="accent" onClick={handleDownload} disabled={isGenerating}>
                <i className="bi-cloud-arrow-down text-lg mr-1" />
                {t("download_qr_code")}
              </Button>
              <Button variant="ghost" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <BeatLoader color="oklch(var(--p))" size={16} />
                ) : (
                  <>
                    <i className="bi-arrow-clockwise text-lg mr-1" />
                    {t("regenerate_qr_code")}
                  </>
                )}
              </Button>
            </div>

            {confirmDelete ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-red-500">
                  {t("confirm_delete_qr_code")}
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? (
                      <BeatLoader color="oklch(var(--p))" size={16} />
                    ) : (
                      <>
                        <i className="bi-trash text-lg mr-1" />
                        {t("confirm")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-red-500"
                onClick={handleDelete}
              >
                <i className="bi-trash text-lg mr-1" />
                {t("delete_qr_code")}
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <i className="bi-qr-code text-6xl text-neutral" />
            <p className="text-neutral text-center">
              {t("no_qr_code_yet")}
            </p>
            <Button variant="accent" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <BeatLoader color="oklch(var(--p))" size={16} />
              ) : (
                t("generate_qr_code")
              )}
            </Button>
          </div>
        )}
      </div>
      </div>
    </Modal>
  );
}