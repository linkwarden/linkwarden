import React, { MouseEventHandler, ReactNode, useEffect } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { Drawer } from "vaul";

type Props = {
  toggleModal: Function;
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
};

export default function Modal({
  toggleModal,
  className,
  children,
  dismissible = true,
}: Props) {
  const [drawerIsOpen, setDrawerIsOpen] = React.useState(true);

  useEffect(() => {
    if (window.innerWidth >= 640) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "relative";
      return () => {
        document.body.style.overflow = "auto";
        document.body.style.position = "";
      };
    }
  }, []);

  if (window.innerWidth < 640) {
    return (
      <Drawer.Root
        open={drawerIsOpen}
        onClose={() => dismissible && setDrawerIsOpen(false)}
        onAnimationEnd={(isOpen) => !isOpen && toggleModal()}
        dismissible={dismissible}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="flex flex-col rounded-t-2xl h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-30">
            <div
              className="p-4 bg-base-100 rounded-t-2xl flex-1 border-neutral-content border-t overflow-y-auto"
              data-testid="mobile-modal-container"
            >
              <div
                className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-neutral mb-5"
                data-testid="mobile-modal-slider"
              />

              {children}
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
          className={`w-full mt-auto sm:m-auto sm:w-11/12 sm:max-w-2xl ${
            className || ""
          }`}
        >
          <div
            className="slide-up mt-auto sm:m-auto relative border-neutral-content rounded-t-2xl sm:rounded-2xl border-t sm:border shadow-2xl p-5 bg-base-100 overflow-y-auto sm:overflow-y-visible"
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
            {children}
          </div>
        </ClickAwayHandler>
      </div>
    );
  }
}
