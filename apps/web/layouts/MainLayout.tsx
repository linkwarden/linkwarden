import Navbar from "@/components/Navbar";
import Announcement from "@/components/Announcement";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import getLatestVersion from "@/lib/client/getLatestVersion";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const showAnnouncementBar = localStorage.getItem("showAnnouncementBar");
  const sidebarState = localStorage.getItem("sidebarIsCollapsed");

  const [showAnnouncement, setShowAnnouncement] = useState(
    showAnnouncementBar ? showAnnouncementBar === "true" : true
  );
  const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState(
    sidebarState ? sidebarState === "true" : false
  );

  useEffect(() => {
    getLatestVersion(setShowAnnouncement);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "showAnnouncementBar",
      showAnnouncement ? "true" : "false"
    );
  }, [showAnnouncement]);

  useEffect(() => {
    localStorage.setItem(
      "sidebarIsCollapsed",
      sidebarIsCollapsed ? "true" : "false"
    );
  }, [sidebarIsCollapsed]);

  const toggleAnnouncementBar = () => setShowAnnouncement(!showAnnouncement);
  const toggleSidebar = () => setSidebarIsCollapsed(!sidebarIsCollapsed);

  return (
    <div className="flex" data-testid="dashboard-wrapper">
      {showAnnouncement && (
        <Announcement toggleAnnouncementBar={toggleAnnouncementBar} />
      )}
      <div className="hidden lg:block">
        <Sidebar
          className={`${sidebarIsCollapsed ? "w-14" : "w-80"}`}
          toggleSidebar={toggleSidebar}
          sidebarIsCollapsed={sidebarIsCollapsed}
        />
      </div>

      <div
        className={`${
          sidebarIsCollapsed
            ? "lg:w-[calc(100%-56px)]"
            : "lg:w-[calc(100%-320px)]"
        } w-full sm:pb-0 pb-20 flex flex-col min-h-screen`}
      >
        <Navbar />
        {children}
      </div>
    </div>
  );
}
