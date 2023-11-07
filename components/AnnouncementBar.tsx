import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { MouseEventHandler } from "react";

type Props = {
  toggleAnnouncementBar: MouseEventHandler<HTMLButtonElement>;
};

export default function AnnouncementBar({ toggleAnnouncementBar }: Props) {
  return (
    <div className="fixed w-full z-20 dark:bg-neutral-900 bg-white">
      <div className="w-full h-10 rainbow flex items-center justify-center">
        <div className="w-fit font-semibold">
          🎉️{" "}
          <Link
            href="https://blog.linkwarden.app/releases/v2.0"
            target="_blank"
            className="underline hover:opacity-50 duration-100"
          >
            Linkwarden v2.0
          </Link>{" "}
          is now out! 🥳️
        </div>

        <button
          className="fixed top-3 right-3 hover:opacity-50 duration-100"
          onClick={toggleAnnouncementBar}
        >
          <FontAwesomeIcon icon={faClose} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
