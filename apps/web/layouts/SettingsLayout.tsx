import SettingsSidebar from "@/components/SettingsSidebar";
import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Link from "next/link";
import useWindowDimensions from "@/hooks/useWindowDimensions";

interface Props {
  children: ReactNode;
}

export default function SettingsLayout({ children }: Props) {
  const router = useRouter();

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
      <div className="flex max-w-screen-md mx-auto">
        <div className="hidden lg:block fixed h-screen">
          <SettingsSidebar />
        </div>

        <div className="w-full min-h-screen p-5 lg:ml-64">
          <div className="gap-2 inline-flex mr-3">
            <div
              onClick={toggleSidebar}
              className="text-neutral btn btn-square btn-sm btn-ghost lg:hidden"
            >
              <i className="bi-list text-2xl leading-none"></i>
            </div>

            <Link
              href="/dashboard"
              className="text-neutral btn btn-square btn-sm btn-ghost"
            >
              <i className="bi-chevron-left text-xl"></i>
            </Link>
          </div>

          {children}

          {sidebar && (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <SettingsSidebar />
                </div>
              </ClickAwayHandler>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
