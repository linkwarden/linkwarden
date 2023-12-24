import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React from "react";

export default function LinkIcon({
  link,
  width,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  width?: string;
}) {
  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const iconClasses: string =
    "bg-white shadow rounded-md border-[2px] flex item-center justify-center border-white select-none z-10" +
    " " +
    (width || "w-12");

  const [showFavicon, setShowFavicon] = React.useState<boolean>(true);

  return (
    <>
      {link.url && url && showFavicon ? (
        <Image
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=32`}
          width={64}
          height={64}
          alt=""
          className={iconClasses}
          draggable="false"
          onError={() => {
            setShowFavicon(false);
          }}
        />
      ) : showFavicon === false ? (
        <div className={iconClasses}>
          <i className="bi-link-45deg text-4xl text-black"></i>
        </div>
      ) : link.type === "pdf" ? (
        <i className={`bi-file-earmark-pdf ${iconClasses}`}></i>
      ) : link.type === "image" ? (
        <i className={`bi-file-earmark-image ${iconClasses}`}></i>
      ) : undefined}
    </>
  );
}
