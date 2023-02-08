import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function useRedirection() {
  const router = useRouter();
  const { status } = useSession();
  const [redirect, setRedirect] = useState(true);

  useEffect(() => {
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
  }, [status]);

  return redirect;
}
