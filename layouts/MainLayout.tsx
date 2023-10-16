import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";

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

  return (
    <>
      <ModalManagement />

      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar className="fixed top-0" />
        </div>

        <div className="w-full flex flex-col h-screen lg:ml-64 xl:ml-80">
          <Navbar />
          {children}
        </div>
      </div>
    </>
  );
}
