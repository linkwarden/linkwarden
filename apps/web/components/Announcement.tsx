import Link from "next/link";
import React from "react";
import { Trans } from "next-i18next";
import { Button } from "@/components/ui/button";
import { LatestAnnouncement } from "@/lib/client/getLatestAnnouncement";

type Props = {
  announcement: LatestAnnouncement;
  dismissAnnouncement: () => void;
};

export default function Announcement({
  announcement,
  dismissAnnouncement,
}: Props) {
  const { id: announcementId, message: announcementMessage } = announcement;

  return (
    <div className="fixed mx-auto bottom-20 sm:bottom-10 w-full pointer-events-none p-5 z-30">
      <div className="mx-auto pointer-events-auto p-2 flex justify-between gap-2 items-center border border-primary shadow-xl rounded-xl bg-base-300 backdrop-blur-sm bg-opacity-80 max-w-md">
        <i className="bi-stars text-xl text-yellow-600 dark:text-yellow-500"></i>
        <p className="w-4/5 text-center text-sm sm:text-base">
          {announcementMessage ? (
            <Trans
              i18nKey={announcementMessage}
              components={[
                <Link
                  href={`https://linkwarden.app/blog`}
                  target="_blank"
                  className="underline decoration-dotted underline-offset-4 hover:text-primary duration-100"
                  key={0}
                />,
              ]}
            />
          ) : (
            <Trans
              i18nKey="new_version_announcement"
              values={{ version: announcementId }}
              components={[
                <Link
                  href={`https://linkwarden.app/blog/releases/${announcementId}`}
                  target="_blank"
                  className="underline decoration-dotted underline-offset-4 hover:text-primary duration-100"
                  key={0}
                />,
              ]}
            />
          )}
        </p>
        <Button variant="ghost" size="icon" onClick={dismissAnnouncement}>
          <i className="bi-x text-xl"></i>
        </Button>
      </div>
    </div>
  );
}
