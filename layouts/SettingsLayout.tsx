import SettingsSidebar from "@/components/SettingsSidebar";
import { ReactNode, useEffect, useState } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";
import { useRouter } from "next/router";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

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

  window.addEventListener("resize", () => setSidebar(false));

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  return (
    <>
      <ModalManagement />

      <div className="flex">
        <div className="hidden lg:block">
          <SettingsSidebar className="fixed top-0" />
        </div>

        <div className="w-full flex flex-col h-screen lg:ml-64 xl:ml-80 p-5">
          <div className="flex gap-3">
            <div
              onClick={toggleSidebar}
              className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </div>

            <p className="capitalize text-3xl">
              {router.asPath.split("/").pop()} Settings
            </p>
          </div>
          <hr className="my-3" />
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
