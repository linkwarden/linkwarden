import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import useRedirect from "@/hooks/useRedirect";
import { useRouter } from "next/router";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const redirect = useRedirect();
  const routeExists = router.route === "/_error" ? false : true;

  if (status === "authenticated" && !redirect && routeExists)
    return (
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar className="fixed" />
        </div>

        <div className="w-full lg:ml-64 xl:ml-80">
          <Navbar />
          {children}
        </div>
      </div>
    );
  else if ((status === "unauthenticated" && !redirect) || !routeExists)
    return <>{children}</>;
  else return <></>;
}
