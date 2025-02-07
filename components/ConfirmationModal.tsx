import React, { MouseEventHandler, ReactNode, useEffect } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { Drawer } from "vaul";
import clsx from "clsx";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import Button from "./ui/Button";
import { useTranslation } from "react-i18next";

type Props = {
  toggleModal: Function;
  children: ReactNode;
  title: string;
  onConfirmed: Function;
  className?: string;
  dismissible?: boolean;
};

export default function ConfirmationModal({
  toggleModal,
  className,
  title,
  onConfirmed,
  children,
  dismissible = true,
}: Props) {
  const { t } = useTranslation();
  const [drawerIsOpen, setDrawerIsOpen] = React.useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (width >= 640) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "relative";
      return () => {
        document.body.style.overflow = "auto";
        document.body.style.position = "";
      };
    }
  }, []);

  if (width < 640) {
    return (
      <Drawer.Root
        open={drawerIsOpen}
        onClose={() => dismissible && setDrawerIsOpen(false)}
        onAnimationEnd={(isOpen) => !isOpen && toggleModal()}
        dismissible={dismissible}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="flex flex-col rounded-t-2xl h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-30 outline-none">
            <div
              className="p-4 bg-base-100 rounded-t-2xl flex-1 border-neutral-content border-t overflow-y-auto"
              data-testid="mobile-modal-container"
            >
              <div
                className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-neutral mb-5"
                data-testid="mobile-modal-slider"
              />
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
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  } else {
    return (
      <div
        className="overflow-y-auto pt-2 sm:py-2 fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex justify-center items-center fade-in z-40"
        data-testid="modal-outer"
      >
        <ClickAwayHandler
          onClickOutside={() => dismissible && toggleModal()}
          className={clsx(
            "w-full mt-auto sm:m-auto sm:w-11/12 sm:max-w-2xl",
            className
          )}
        >
          <div
            className={
              "slide-up mt-auto sm:m-auto relative border-neutral-content rounded-t-2xl sm:rounded-2xl border-t sm:border shadow-2xl bg-base-100 overflow-y-auto sm:overflow-y-visible p-5"
            }
            data-testid="modal-container"
          >
            {dismissible && (
              <div
                onClick={toggleModal as MouseEventHandler<HTMLDivElement>}
                className="absolute top-4 right-3 btn btn-sm outline-none btn-circle btn-ghost z-10"
              >
                <i
                  className="bi-x text-neutral text-2xl"
                  data-testid="close-modal-button"
                ></i>
              </div>
            )}
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
          </div>
        </ClickAwayHandler>
      </div>
    );
  }
}
