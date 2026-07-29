import Announcement from "@/components/Announcement";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import getLatestAnnouncement, {
  LatestAnnouncement,
} from "@/lib/client/getLatestAnnouncement";
import DragNDrop from "@/components/DragNDrop";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import useSidebarCollapse from "@/hooks/useSidebarCollapse";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const { data: user } = useUser();
  const updateUserPreference = useUpdateUserPreference();

  const [announcement, setAnnouncement] = useState<LatestAnnouncement | null>(
    null
  );
  const { sidebarIsCollapsed, toggleSidebar } = useSidebarCollapse();

  useEffect(() => {
    getLatestAnnouncement().then(setAnnouncement);
  }, []);

  const showAnnouncement =
    !!announcement &&
    !!user?.id &&
    user.dismissedAnnouncementId !== announcement.id;

  const dismissAnnouncement = () => {
    if (!announcement) return;
    updateUserPreference.mutate({ dismissedAnnouncementId: announcement.id });
  };

  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);

  return (
    <DragNDrop activeLink={activeLink} setActiveLink={setActiveLink}>
      <div className="flex" data-testid="dashboard-wrapper">
        {showAnnouncement && announcement && (
          <Announcement
            announcement={announcement}
            dismissAnnouncement={dismissAnnouncement}
          />
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
