import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
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
    <>
      {showAnnouncement ? (
        <AnnouncementBar toggleAnnouncementBar={toggleAnnouncementBar} />
      ) : undefined}

      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar
            className={`fixed ${showAnnouncement ? "top-10" : "top-0"}`}
          />
        </div>

        <div
          className={`w-full sm:pb-0 pb-20 flex flex-col min-h-${
            showAnnouncement ? "full" : "screen"
          } lg:ml-80 ${showAnnouncement ? "mt-10" : ""}`}
        >
          <Navbar />
          {children}
        </div>
      </div>
    </>
  );
}
