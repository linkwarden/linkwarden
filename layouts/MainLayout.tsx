import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import useRedirect from "@/hooks/useRedirect";
import { useRouter } from "next/router";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  const { status, data } = useSession();
  const router = useRouter();
  const redirect = useRedirect();
  const routeExists = router.route === "/_error" ? false : true;

  const { modal } = useModalStore();

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

  if (status === "authenticated" && !redirect && routeExists)
    return (
      <>
        <ModalManagement />

        <div className="flex">
          <div className="hidden lg:block">
            <Sidebar className="fixed top-0" />
          </div>

          <div className="w-full lg:ml-64 xl:ml-80">
            <Navbar />
            {children}
          </div>
        </div>
      </>
    );
  else if ((status === "unauthenticated" && !redirect) || !routeExists)
    return <>{children}</>;
  else return <></>;
}
