import React, { ReactNode, useEffect } from "react";
import { Drawer as D } from "vaul";
import clsx from "clsx";

type Props = {
  toggleDrawer: Function;
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
};

export default function Drawer({
  toggleDrawer,
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
      <D.Root
        open={drawerIsOpen}
        onClose={() => dismissible && setDrawerIsOpen(false)}
        onAnimationEnd={(isOpen) => !isOpen && toggleDrawer()}
        dismissible={dismissible}
      >
        <D.Portal>
          <D.Overlay className="fixed inset-0 bg-black/40" />
          <D.Content className="flex flex-col rounded-t-2xl mt-24 fixed bottom-0 left-0 right-0 z-30 h-[90%] !select-auto focus:outline-none">
            <div
              className={clsx(
                "p-4 bg-base-100 rounded-t-2xl flex-1 border-neutral-content border-t overflow-y-auto",
                className
              )}
              data-testid="mobile-modal-container"
            >
              <div data-testid="mobile-modal-slider" />
              {children}
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    );
  } else {
    return (
      <D.Root
        open={drawerIsOpen}
        onClose={() => dismissible && setDrawerIsOpen(false)}
        onAnimationEnd={(isOpen) => !isOpen && toggleDrawer()}
        dismissible={dismissible}
        direction="right"
      >
        <D.Portal>
          <D.Overlay className="fixed inset-0 bg-black/10 z-20" />
          <D.Content className="bg-white flex flex-col h-full w-2/5 min-w-[30rem] mt-24 fixed bottom-0 right-0 z-40 !select-auto focus:outline-none">
            <div
              className={clsx(
                "p-4 bg-base-100 flex-1 border-neutral-content border-l overflow-y-auto",
                className
              )}
            >
              {children}
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    );
  }
}
