import SettingsSidebar from "@/components/SettingsSidebar";
import React, { ReactNode } from "react";
import useSidebarCollapse from "@/hooks/useSidebarCollapse";

interface Props {
  children: ReactNode;
}

export default function SettingsLayout({ children }: Props) {
  const { sidebarIsCollapsed, toggleSidebar } = useSidebarCollapse();

  return (
    <div className="flex" data-testid="settings-wrapper">
      <SettingsSidebar
        toggleSidebar={toggleSidebar}
        sidebarIsCollapsed={sidebarIsCollapsed}
      />

      <div
        className={`${
          sidebarIsCollapsed ? "" : "lg:w-[calc(100%-288px)]"
        } w-[calc(100%-56px)] sm:pb-0 pb-20 flex flex-col h-screen overflow-y-auto`}
      >
        {/* <TrialBanner /> */}
        <div className="p-3 mx-auto w-full max-w-3xl min-[2000px]:max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  );
}
