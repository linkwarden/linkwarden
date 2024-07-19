import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useInitialData from "@/hooks/useInitialData";
import useAccountStore from "@/store/account";

interface Props {
  children: ReactNode;
}

const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE === "true";

export default function AuthRedirect({ children }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [shouldRenderChildren, setShouldRenderChildren] = useState(false);
  const { account } = useAccountStore();

  useInitialData();

  useEffect(() => {
    const isLoggedIn = status === "authenticated";
    const isUnauthenticated = status === "unauthenticated";
    const isPublicPage = router.pathname.startsWith("/public");
    const hasInactiveSubscription =
      account.id && !account.subscription?.active && stripeEnabled;

    // There are better ways of doing this... but this one works for now
    const routes = [
      { path: "/login", isProtected: false },
      { path: "/register", isProtected: false },
      { path: "/confirmation", isProtected: false },
      { path: "/forgot", isProtected: false },
      { path: "/auth/reset-password", isProtected: false },
      { path: "/", isProtected: false },
      { path: "/subscribe", isProtected: true },
      { path: "/dashboard", isProtected: true },
      { path: "/settings", isProtected: true },
      { path: "/collections", isProtected: true },
      { path: "/links", isProtected: true },
      { path: "/tags", isProtected: true },
      { path: "/preserved", isProtected: true },
      { path: "/admin", isProtected: true },
      { path: "/search", isProtected: true },
    ];

    if (isPublicPage) {
      setShouldRenderChildren(true);
    } else {
      if (isLoggedIn && hasInactiveSubscription) {
        redirectTo("/subscribe");
      } else if (
        isLoggedIn &&
        !routes.some((e) => router.pathname.startsWith(e.path) && e.isProtected)
      ) {
        redirectTo("/dashboard");
      } else if (
        isUnauthenticated &&
        routes.some((e) => router.pathname.startsWith(e.path) && e.isProtected)
      ) {
        redirectTo("/login");
      } else {
        setShouldRenderChildren(true);
      }
    }
  }, [status, account, router.pathname]);

  function redirectTo(destination: string) {
    router.push(destination).then(() => setShouldRenderChildren(true));
  }

  if (status !== "loading" && shouldRenderChildren) {
    return <>{children}</>;
  } else {
    return <></>;
  }
}
