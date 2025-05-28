import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useGetLink, useLinks } from "@linkwarden/router/links";
import { PreservationContent } from "./PreservationContent";
import PreservationNavbar from "./PreservationNavbar";

export default function PreservationPageContent() {
  const router = useRouter();
  const { links } = useLinks();

  let isPublicRoute = router.pathname.startsWith("/public") ? true : undefined;

  const { data: link, refetch } = useGetLink({
    id: Number(router.query.id),
    isPublicRoute,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      link &&
      (!link?.image || !link?.pdf || !link?.readable || !link?.monolith)
    ) {
      interval = setInterval(() => {
        refetch().catch((error) => {
          console.error("Error refetching link:", error);
        });
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [links]);

  return (
    <div>
      {link?.id && (
        <PreservationNavbar link={link} format={Number(router.query.format)} />
      )}
      <div className="bg-base-200 overflow-y-auto w-screen h-[calc(100vh-3rem)]">
        <PreservationContent link={link} format={Number(router.query.format)} />
      </div>
    </div>
  );
}
