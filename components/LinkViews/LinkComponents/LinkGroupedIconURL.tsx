import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React from "react";
import Link from "next/link";

export default function LinkGroupedIconURL({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const [showFavicon, setShowFavicon] = React.useState<boolean>(true);

  let shortendURL;

  try {
    shortendURL = new URL(link.url || "").host.toLowerCase();
  } catch (error) {
    console.log(error);
  }

  return (
    <Link href={link.url || ""} target="_blank">
      <div className="bg-white shadow-md rounded-md border-[2px] flex gap-1 item-center justify-center border-white select-none z-10 max-w-full">
        {link.url && url && showFavicon ? (
          <Image
            src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=32`}
            width={64}
            height={64}
            alt=""
            className="w-5 h-5 rounded"
            draggable="false"
            onError={() => {
              setShowFavicon(false);
            }}
          />
        ) : showFavicon === false ? (
          <i className="bi-link-45deg text-xl leading-none text-black"></i>
        ) : link.type === "pdf" ? (
          <i className={`bi-file-earmark-pdf`}></i>
        ) : link.type === "image" ? (
          <i className={`bi-file-earmark-image`}></i>
        ) : undefined}
        <p className="truncate bg-white text-black mr-1">
          <p className="text-sm">{shortendURL}</p>
        </p>
      </div>
    </Link>
  );
}
