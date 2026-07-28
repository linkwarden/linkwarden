import AdminSidebar from "@/components/AdminSidebar";
import React, { ReactNode } from "react";
import useSidebarCollapse from "@/hooks/useSidebarCollapse";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { sidebarIsCollapsed, toggleSidebar } = useSidebarCollapse();

  return (
    <div className="flex" data-testid="admin-wrapper">
      <AdminSidebar
        toggleSidebar={toggleSidebar}
        sidebarIsCollapsed={sidebarIsCollapsed}
      />

      <div
        className={`${
          sidebarIsCollapsed ? "" : "lg:w-[calc(100%-288px)]"
        } w-[calc(100%-56px)] sm:pb-0 pb-20 flex flex-col h-screen overflow-y-auto`}
      >
        {/* <TrialBanner /> */}
        <div className="p-5 mx-auto w-full max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
