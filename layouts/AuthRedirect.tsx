import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useInitialData from "@/hooks/useInitialData";

interface Props {
  children: ReactNode;
}

export default function AuthRedirect({ children }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [redirect, setRedirect] = useState(true);

  useInitialData();

  useEffect(() => {
    if (!router.pathname.startsWith("/public")) {
      if (
        status === "authenticated" &&
        (router.pathname === "/login" || router.pathname === "/register")
      ) {
        router.push("/").then(() => {
          setRedirect(false);
        });
      } else if (
        status === "unauthenticated" &&
        !(router.pathname === "/login" || router.pathname === "/register")
      ) {
        router.push("/login").then(() => {
          setRedirect(false);
        });
      } else if (status === "loading") setRedirect(true);
      else setRedirect(false);
    } else {
      setRedirect(false);
    }
  }, [status]);

  if (status !== "loading" && !redirect) return <>{children}</>;
  else return <></>;
}
