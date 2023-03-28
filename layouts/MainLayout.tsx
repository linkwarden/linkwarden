import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import useRedirection from "@/hooks/useRedirection";
import { useRouter } from "next/router";
import getInitialData from "@/lib/client/getInitialData";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const redirection = useRedirection();
  const routeExists = router.route === "/_error" ? false : true;

  getInitialData();

  if (status === "authenticated" && !redirection && routeExists)
    return (
      <>
        <Sidebar />
        <div className="ml-80">
          <Navbar />
          {children}
        </div>
      </>
    );
  else if ((status === "unauthenticated" && !redirection) || !routeExists)
    return <>{children}</>;
  else return <Loader />;
}
