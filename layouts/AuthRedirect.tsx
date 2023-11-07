import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useInitialData from "@/hooks/useInitialData";
import useAccountStore from "@/store/account";

interface Props {
  children: ReactNode;
}

export default function AuthRedirect({ children }: Props) {
  const router = useRouter();
  const { status, data } = useSession();
  const [redirect, setRedirect] = useState(true);
  const { account } = useAccountStore();

  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true";
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE === "true";

  useInitialData();

  useEffect(() => {
    if (!router.pathname.startsWith("/public")) {
      if (
        status === "authenticated" &&
        account.id &&
        !account.subscription?.active &&
        stripeEnabled
      ) {
        router.push("/subscribe").then(() => {
          setRedirect(false);
        });
      }
      // Redirect to "/choose-username" if user is authenticated and is either a subscriber OR subscription is undefiend, and doesn't have a username
      else if (
        emailEnabled &&
        status === "authenticated" &&
        account.subscription?.active &&
        stripeEnabled &&
        account.id &&
        !account.username
      ) {
        router.push("/choose-username").then(() => {
          setRedirect(false);
        });
      } else if (
        status === "authenticated" &&
        account.id &&
        (router.pathname === "/login" ||
          router.pathname === "/register" ||
          router.pathname === "/confirmation" ||
          router.pathname === "/subscribe" ||
          router.pathname === "/choose-username" ||
          router.pathname === "/forgot" ||
          router.pathname === "/")
      ) {
        router.push("/dashboard").then(() => {
          setRedirect(false);
        });
      } else if (
        status === "unauthenticated" &&
        !(
          router.pathname === "/login" ||
          router.pathname === "/register" ||
          router.pathname === "/confirmation" ||
          router.pathname === "/forgot"
        )
      ) {
        router.push("/login").then(() => {
          setRedirect(false);
        });
      } else if (status === "loading") setRedirect(true);
      else setRedirect(false);
    } else {
      setRedirect(false);
    }
  }, [status, account, router.pathname]);

  if (status !== "loading" && !redirect) return <>{children}</>;
  else return <></>;
  // return <>{children}</>;
}
