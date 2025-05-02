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
  const [showAnnouncement, setShowAnnouncement] = useState(
    showAnnouncementBar ? showAnnouncementBar === "true" : true
  );

  useEffect(() => {
    getLatestVersion(setShowAnnouncement);
  }, []);

  useEffect(() => {
    if (showAnnouncement) {
      localStorage.setItem("showAnnouncementBar", "true");
      setShowAnnouncement(true);
    } else if (!showAnnouncement) {
      localStorage.setItem("showAnnouncementBar", "false");
      setShowAnnouncement(false);
    }
  }, [showAnnouncement]);

  const toggleAnnouncementBar = () => {
    setShowAnnouncement(!showAnnouncement);
  };

  return (
    <div className="flex" data-testid="dashboard-wrapper">
      {showAnnouncement && (
        <Announcement toggleAnnouncementBar={toggleAnnouncementBar} />
      )}
      <div className="hidden lg:block">
        <Sidebar className={`fixed top-0`} />
      </div>

      <div
        className={`lg:w-[calc(100%-320px)] overflow-x-hidden w-full sm:pb-0 pb-20 flex flex-col min-h-screen lg:ml-80`}
      >
        <Navbar />
        {children}
      </div>
    </div>
  );
}
