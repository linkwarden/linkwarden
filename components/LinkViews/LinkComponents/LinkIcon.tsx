import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React from "react";

export default function LinkIcon({
  link,
  className,
  size,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  className?: string;
  size?: "small" | "medium";
}) {
  let iconClasses: string =
    "bg-white shadow rounded-md border-[2px] flex item-center justify-center border-white select-none z-10 " +
    (className || "");

  let dimension;

  switch (size) {
    case "small":
      dimension = " w-8 h-8";
      break;
    case "medium":
      dimension = " w-12 h-12";
      break;
    default:
      size = "medium";
      dimension = " w-12 h-12";
      break;
  }

  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

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
            className={iconClasses + dimension}
            draggable="false"
            onError={() => {
              setShowFavicon(false);
            }}
          />
        ) : (
          <LinkPlaceholderIcon
            iconClasses={iconClasses + dimension}
            size={size}
            icon="bi-link-45deg"
          />
        )
      ) : link.type === "pdf" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses + dimension}
          size={size}
          icon="bi-file-earmark-pdf"
        />
      ) : link.type === "image" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses + dimension}
          size={size}
          icon="bi-file-earmark-image"
        />
      ) : // : link.type === "monolith" ? (
      //   <LinkPlaceholderIcon
      //     iconClasses={iconClasses + dimension}
      //     size={size}
      //     icon="bi-filetype-html"
      //   />
      // )
      undefined}
    </>
  );
}

const LinkPlaceholderIcon = ({
  iconClasses,
  size,
  icon,
}: {
  iconClasses: string;
  size?: "small" | "medium";
  icon: string;
}) => {
  return (
    <div
      className={`${
        size === "small" ? "text-2xl" : "text-4xl"
      } text-black aspect-square ${iconClasses}`}
    >
      <i className={`${icon} m-auto`}></i>
    </div>
  );
};
