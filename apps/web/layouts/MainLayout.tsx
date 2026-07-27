import Announcement from "@/components/Announcement";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import getLatestVersion from "@/lib/client/getLatestVersion";
import DragNDrop from "@/components/DragNDrop";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import useSidebarCollapse from "@/hooks/useSidebarCollapse";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const showAnnouncementBar = localStorage.getItem("showAnnouncementBar");

  const [showAnnouncement, setShowAnnouncement] = useState(
    showAnnouncementBar ? showAnnouncementBar === "true" : true
  );
  const { sidebarIsCollapsed, toggleSidebar } = useSidebarCollapse();

  useEffect(() => {
    getLatestVersion(setShowAnnouncement);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "showAnnouncementBar",
      showAnnouncement ? "true" : "false"
    );
  }, [showAnnouncement]);

  const toggleAnnouncementBar = () => setShowAnnouncement(!showAnnouncement);

  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);

  return (
    <DragNDrop activeLink={activeLink} setActiveLink={setActiveLink}>
      <div className="flex" data-testid="dashboard-wrapper">
        {showAnnouncement && (
          <Announcement toggleAnnouncementBar={toggleAnnouncementBar} />
        )}
        <Sidebar
          toggleSidebar={toggleSidebar}
          sidebarIsCollapsed={sidebarIsCollapsed}
        />

        <div
          className={`${
            sidebarIsCollapsed ? "" : "lg:w-[calc(100%-288px)]"
          } w-[calc(100%-56px)] sm:pb-0 pb-20 flex flex-col h-screen overflow-y-auto`}
        >
          {children}
        </div>
      </div>
    </DragNDrop>
  );
}
