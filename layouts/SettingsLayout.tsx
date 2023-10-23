import SettingsSidebar from "@/components/SettingsSidebar";
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

export default function SettingsLayout({ children }: Props) {
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

      <div className="flex max-w-screen-md mx-auto">
        <div className="hidden lg:block fixed h-screen">
          <SettingsSidebar />
        </div>

        <div className="w-full flex flex-col min-h-screen p-5 lg:ml-64">
          <div className="flex gap-3">
            <div
              onClick={toggleSidebar}
              className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </div>

            <Link
              href="/dashboard"
              className="inline-flex gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
            </Link>

            <p className="capitalize text-3xl font-thin">
              {router.asPath.split("/").pop()} Settings
            </p>
          </div>

          <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" />

          {children}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <SettingsSidebar />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
