import React, { ReactNode, useEffect } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { Drawer as D } from "vaul";

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
        onClose={() => dismissible && setTimeout(() => toggleDrawer(), 350)}
        dismissible={dismissible}
      >
        <D.Portal>
          <D.Overlay className="fixed inset-0 bg-black/40" />
          <ClickAwayHandler
            onClickOutside={() => dismissible && setDrawerIsOpen(false)}
          >
            <D.Content className="flex flex-col rounded-t-2xl mt-24 fixed bottom-0 left-0 right-0 z-30 h-[90%]">
              <div
                className="p-4 bg-base-100 rounded-t-2xl flex-1 border-neutral-content border-t overflow-y-auto"
                data-testid="mobile-modal-container"
              >
                <div
                  className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-neutral mb-5 relative z-20"
                  data-testid="mobile-modal-slider"
                />
                {children}
              </div>
            </D.Content>
          </ClickAwayHandler>
        </D.Portal>
      </D.Root>
    );
  } else {
    return (
      <D.Root
        open={drawerIsOpen}
        onClose={() => dismissible && setTimeout(() => toggleDrawer(), 350)}
        dismissible={dismissible}
        direction="right"
      >
        <D.Portal>
          <D.Overlay className="fixed inset-0 bg-black/10 z-20" />
          <ClickAwayHandler
            onClickOutside={() => dismissible && setDrawerIsOpen(false)}
            className="z-30"
          >
            <D.Content className="bg-white flex flex-col h-full w-2/5 min-w-[30rem] mt-24 fixed bottom-0 right-0 z-40 !select-auto">
              <div
                className={
                  "p-4 bg-base-100 flex-1 border-neutral-content border-l overflow-y-auto " +
                  className
                }
              >
                {children}
              </div>
            </D.Content>
          </ClickAwayHandler>
        </D.Portal>
      </D.Root>
    );
  }
}
