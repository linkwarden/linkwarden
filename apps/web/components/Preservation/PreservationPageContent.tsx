import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useGetLink, useLinks } from "@linkwarden/router/links";
import { PreservationContent } from "./PreservationContent";
import PreservationNavbar from "./PreservationNavbar";
import { ArchivedFormat } from "@linkwarden/types";

export default function PreservationPageContent() {
  const router = useRouter();
  const { links } = useLinks();

  const [showNavbar, setShowNavbar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const st = container.scrollTop;
      // if scrolling down and beyond a small threshold, hide
      if (st - 10 > lastScrollTop.current) {
        if (Number(router.query.format) === ArchivedFormat.readability)
          setShowNavbar(false);
      }
      // if scrolling up, show
      else if (st < lastScrollTop.current - 10) {
        setShowNavbar(true);
      }
      lastScrollTop.current = st <= 0 ? 0 : st; // for Mobile or negative
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [router.query.format]);

  return (
    <div>
      {link?.id && (
        <PreservationNavbar
          link={link}
          format={Number(router.query.format)}
          className={`
            transform transition-transform duration-200 ease-in-out fixed top-0 left-0 right-0
            ${showNavbar ? "translate-y-0" : "-translate-y-full"}
          `}
        />
      )}
      <div
        className={`bg-base-200 overflow-y-auto w-screen  ${
          showNavbar ? "h-[calc(100vh-3.1rem)] mt-[3.1rem]" : "h-screen"
        }`}
        ref={scrollRef}
      >
        <PreservationContent link={link} format={Number(router.query.format)} />
      </div>
    </div>
  );
}
