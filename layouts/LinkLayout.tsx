import LinkSidebar from "@/components/LinkSidebar";
import { ReactNode, useEffect, useState } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";
import { useRouter } from "next/router";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import useWindowDimensions from "@/hooks/useWindowDimensions";

interface Props {
  children: ReactNode;
}

export default function LinkLayout({ children }: Props) {
  const { modal } = useModalStore();

  const router = useRouter();

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    setSidebar(false);
  }, [width]);

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  return (
    <>
      <ModalManagement />

      <div className="flex mx-auto">
        <div className="hidden lg:block fixed left-5 h-screen">
          <LinkSidebar />
        </div>

        <div className="w-full flex flex-col min-h-screen max-w-screen-md mx-auto p-5">
          <div className="flex gap-3 mb-5 duration-100">
            <div
              onClick={toggleSidebar}
              className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </div>

            <div
              onClick={() => router.back()}
              className="inline-flex gap-1 lg:hover:opacity-60 items-center select-none cursor-pointer p-2 lg:p-0 lg:px-1 lg:my-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700 lg:hover:bg-transparent lg:dark:hover:bg-transparent"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
              Back
            </div>
          </div>

          {children}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <LinkSidebar onClick={() => setSidebar(false)} />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
