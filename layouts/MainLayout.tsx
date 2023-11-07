import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";
import getLatestVersion from "@/lib/client/getLatestVersion";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const { modal } = useModalStore();

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

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
      <ModalManagement />

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
          className={`w-full flex flex-col min-h-screen lg:ml-64 xl:ml-80 ${
            showAnnouncement ? "mt-10" : ""
          }`}
        >
          <Navbar />
          {children}
        </div>
      </div>
    </>
  );
}
