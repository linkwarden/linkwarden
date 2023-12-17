import Link from "next/link";
import React, { MouseEventHandler } from "react";

type Props = {
  toggleAnnouncementBar: MouseEventHandler<HTMLButtonElement>;
};

export default function AnnouncementBar({ toggleAnnouncementBar }: Props) {
  return (
    <div className="fixed w-full z-20 bg-base-200">
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
          className="fixed right-3 hover:opacity-50 duration-100"
          onClick={toggleAnnouncementBar}
        >
          <i
            className="bi-x text-neutral text-2xl"
          ></i>
        </button>
      </div>
    </div>
  );
}
