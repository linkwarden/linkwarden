import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useGetLink } from "@linkwarden/router/links";
import { PreservationContent } from "./PreservationContent";

export default function PreservationPageContent() {
  const router = useRouter();

  let isPublicRoute = router.pathname.startsWith("/public") ? true : undefined;

  const {
    data: link,
    mutateAsync: fetchLink,
    error,
  } = useGetLink(isPublicRoute);

  useEffect(() => {
    fetchLink({
      id: Number(router.query.id),
      isPublicRoute,
    });

    let interval: NodeJS.Timeout | null = null;
    if (
      link &&
      (!link?.image || !link?.pdf || !link?.readable || !link?.monolith)
    ) {
      interval = setInterval(() => {
        fetchLink({ id: link.id as number });
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-base-200">
      <PreservationContent link={link} format={Number(router.query.format)} />
    </div>
  );
}
