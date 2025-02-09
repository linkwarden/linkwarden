import React, { ReactNode } from "react";
import Button from "./ui/Button";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";

type Props = {
  toggleModal: Function;
  className?: string;
  children: ReactNode;
  title: string;
  onConfirmed: Function;
  dismissible?: boolean;
};

export default function ConfirmationModal({
  toggleModal,
  className,
  children,
  title,
  onConfirmed,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal toggleModal={toggleModal} className={className}>
      <p className="text-xl font-thin">{title}</p>
      <div className="divider mb-3 mt-1"></div>
      {children}
      <div className="w-full flex items-center justify-end gap-2 mt-3">
        <Button
          intent="ghost"
          className="hover:bg-base-200"
          onClick={() => toggleModal()}
        >
          {t("cancel")}
        </Button>
        <Button
          intent="destructive"
          onClick={async () => {
            await onConfirmed();
            toggleModal();
          }}
        >
          {t("confirm")}
        </Button>
      </div>
    </Modal>
  )
}
