import Link from "next/link";
import React, { MouseEventHandler } from "react";
import { Trans } from "next-i18next";

type Props = {
  toggleAnnouncementBar: MouseEventHandler<HTMLButtonElement>;
};

export default function Announcement({ toggleAnnouncementBar }: Props) {
  const announcementId = localStorage.getItem("announcementId");

  return (
    <div className="fixed mx-auto bottom-20 sm:bottom-10 w-full pointer-events-none p-5 z-30">
      <div className="mx-auto pointer-events-auto p-2 flex justify-between gap-2 items-center border border-primary shadow-xl rounded-xl bg-base-300 backdrop-blur-sm bg-opacity-80 max-w-md">
        <i className="bi-stars text-2xl text-yellow-600 dark:text-yellow-500"></i>
        <p className="w-4/5 text-center text-sm sm:text-base">
          <Trans
            i18nKey="new_version_announcement"
            values={{ version: announcementId }}
            components={[
              <Link
                href={`https://blog.linkwarden.app/releases/${announcementId}`}
                target="_blank"
                className="underline"
                key={0}
              />,
            ]}
          />
        </p>
        <button
          onClick={toggleAnnouncementBar}
          className="btn btn-ghost btn-square btn-sm"
        >
          <i className="bi-x text-xl"></i>
        </button>
      </div>
    </div>
  );
}
