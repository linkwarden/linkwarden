import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useGetLink } from "@linkwarden/router/links";
import { useUser } from "@linkwarden/router/user";
import {
  useGetReadingProgress,
  useUpdateReadingProgress,
} from "@linkwarden/router/readingProgress";
import { ArchivedFormat } from "@linkwarden/types/global";
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

  const { data: user } = useUser();

  const trackReadingProgress =
    !isPublicRoute &&
    Number(router.query.format) === ArchivedFormat.readability &&
    (user?.readingProgressEnabled ?? false);

  const { data: savedProgress } = useGetReadingProgress(
    link?.id,
    undefined,
    trackReadingProgress
  );
  const updateReadingProgress = useUpdateReadingProgress(link?.id);
  const restoredRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the saved position once the readable content is rendered and its
  // layout has settled (content height can grow while highlights and reader
  // styles are applied).
  useEffect(() => {
    if (
      !trackReadingProgress ||
      restoredRef.current ||
      savedProgress === undefined
    )
      return;

    if (!savedProgress) {
      restoredRef.current = true;
      return;
    }

    let lastHeight = -1;
    const interval = setInterval(() => {
      const element = scrollRef.current;
      if (!element || !document.getElementById("readable-view")) return;

      if (element.scrollHeight !== lastHeight) {
        lastHeight = element.scrollHeight;
        return;
      }

      const maxScroll = element.scrollHeight - element.clientHeight;
      if (maxScroll <= 0) return;

      element.scrollTop = savedProgress * maxScroll;
      restoredRef.current = true;
      clearInterval(interval);
    }, 250);

    const timeout = setTimeout(() => clearInterval(interval), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trackReadingProgress, savedProgress]);

  const handleScroll = () => {
    // Don't overwrite the saved progress before it was restored
    if (!trackReadingProgress || !restoredRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const element = scrollRef.current;
      if (!element) return;

      const maxScroll = element.scrollHeight - element.clientHeight;
      if (maxScroll <= 0) return;

      const progress = Math.min(Math.max(element.scrollTop / maxScroll, 0), 1);
      updateReadingProgress.mutate(progress);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div>
      {link?.id && (
        <PreservationNavbar link={link} format={Number(router.query.format)} />
      )}
      <div
        className={`bg-base-200 overflow-y-auto w-screen h-[calc(100vh-3.1rem)] mt-[3.1rem]`}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <PreservationContent link={link} format={Number(router.query.format)} />
      </div>
    </div>
  );
}
