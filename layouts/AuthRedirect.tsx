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
  const { status, data } = useSession();
  const [redirect, setRedirect] = useState(true);

  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

  useInitialData();

  // useEffect(() => {
  //   if (!router.pathname.startsWith("/public")) {
  //     if (
  //       emailEnabled &&
  //       status === "authenticated" &&
  //       (data.user.isSubscriber === true ||
  //         data.user.isSubscriber === undefined) &&
  //       !data.user.username
  //     ) {
  //       router.push("/choose-username").then(() => {
  //         setRedirect(false);
  //       });
  //     } else if (
  //       status === "authenticated" &&
  //       data.user.isSubscriber === false
  //     ) {
  //       router.push("/subscribe").then(() => {
  //         setRedirect(false);
  //       });
  //     } else if (
  //       status === "authenticated" &&
  //       (router.pathname === "/login" ||
  //         router.pathname === "/register" ||
  //         router.pathname === "/confirmation" ||
  //         router.pathname === "/subscribe" ||
  //         router.pathname === "/choose-username" ||
  //         router.pathname === "/forgot")
  //     ) {
  //       router.push("/").then(() => {
  //         setRedirect(false);
  //       });
  //     } else if (
  //       status === "unauthenticated" &&
  //       !(
  //         router.pathname === "/login" ||
  //         router.pathname === "/register" ||
  //         router.pathname === "/confirmation" ||
  //         router.pathname === "/forgot"
  //       )
  //     ) {
  //       router.push("/login").then(() => {
  //         setRedirect(false);
  //       });
  //     } else if (status === "loading") setRedirect(true);
  //     else setRedirect(false);
  //   } else {
  //     setRedirect(false);
  //   }
  // }, [status]);

  // if (status !== "loading" && !redirect) return <>{children}</>;
  // else return <></>;
  return <>{children}</>;
}
