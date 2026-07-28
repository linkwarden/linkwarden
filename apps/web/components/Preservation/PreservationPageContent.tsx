import React, { useRef } from "react";
import { useRouter } from "next/router";
import { useGetLink } from "@linkwarden/router/links";
import { PreservationContent } from "./PreservationContent";
import PreservationNavbar from "./PreservationNavbar";

export default function PreservationPageContent() {
  const router = useRouter();

  const scrollRef = useRef<HTMLDivElement>(null);

  let isPublicRoute = router.pathname.startsWith("/public") ? true : undefined;

  const { data: link } = useGetLink({
    id: Number(router.query.id),
    isPublicRoute,
    enabled: true,
  });

  return (
    <div>
      {link?.id && (
        <PreservationNavbar link={link} format={Number(router.query.format)} />
      )}
      <div
        className={`bg-base-200 overflow-y-auto w-screen h-[calc(100vh-3.1rem)] mt-[3.1rem]`}
        ref={scrollRef}
      >
        <PreservationContent link={link} format={Number(router.query.format)} />
      </div>
    </div>
  );
}
