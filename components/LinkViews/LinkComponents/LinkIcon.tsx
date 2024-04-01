import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React from "react";

export default function LinkIcon({
  link,
  width,
  className,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  width?: string;
  className?: string;
}) {
  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const iconClasses: string =
    "bg-white shadow rounded-md border-[2px] flex item-center justify-center border-white select-none z-10" +
    " " +
    (width || "w-12") +
    " " +
    (className || "");

  const [showFavicon, setShowFavicon] = React.useState<boolean>(true);

  return (
    <>
      {link.type === "url" && url ? (
        showFavicon ? (
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
        ) : (
          <LinkPlaceholderIcon iconClasses={iconClasses} icon="bi-link-45deg" />
        )
      ) : link.type === "pdf" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses}
          icon="bi-file-earmark-pdf"
        />
      ) : link.type === "image" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses}
          icon="bi-file-earmark-image"
        />
      ) : undefined}
    </>
  );
}

const LinkPlaceholderIcon = ({
  iconClasses,
  icon,
}: {
  iconClasses: string;
  icon: string;
}) => {
  return (
    <div className={`text-4xl text-black aspect-square ${iconClasses}`}>
      <i className={`${icon} m-auto`}></i>
    </div>
  );
};
