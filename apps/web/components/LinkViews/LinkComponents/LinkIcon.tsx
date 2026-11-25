import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React, { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { IconWeight } from "@phosphor-icons/react";
import clsx from "clsx";
import oklchVariableToHex from "@/lib/client/oklchVariableToHex";
import { getLinkPlaceholder } from "@linkwarden/lib/linkPlaceholder";

function LinkIcon({
  link,
  className,
  hideBackground,
  onClick,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  className?: string;
  hideBackground?: boolean;
  onClick?: Function;
}) {
  let iconClasses: string = clsx(
    "rounded flex item-center justify-center select-none z-10 w-12 h-12",
    !hideBackground &&
      "rounded-md shadow backdrop-blur-xl bg-white/30 dark:bg-black/30 bg-opacity-50 p-1",
    className
  );

  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const faviconSrc = url
    ? `/api/v1/getFavicon?url=${encodeURIComponent(url.origin)}`
    : undefined;

  const [loadedFavicon, setLoadedFavicon] = useState<string>();
  const faviconLoaded =
    faviconSrc !== undefined && loadedFavicon === faviconSrc;

  // Without a custom icon or favicon a link shows its site's initial, and the
  // type icons take the site's color, like the banner of a card without a
  // preview (LinkPlaceholder)
  const site = useMemo(
    () => getLinkPlaceholder({ url: link.url, name: link.name }),
    [link.url, link.name]
  );

  // Mixed in oklab, like the placeholder's background (see LinkPlaceholder)
  const siteColor = `color-mix(in oklab, ${site.color} 60%, oklch(var(--bc)))`;

  const initialIcon = site.initial ? (
    <LinkPlaceholderIcon
      iconClasses={iconClasses}
      initial={site.initial}
      color={siteColor}
    />
  ) : (
    <LinkPlaceholderIcon
      iconClasses={iconClasses}
      icon="bi-link-45deg"
      color={siteColor}
    />
  );

  return (
    <div onClick={() => onClick && onClick()}>
      {link.icon ? (
        <div className={iconClasses}>
          <Icon
            icon={link.icon}
            size={30}
            weight={(link.iconWeight || "regular") as IconWeight}
            color={link.color || oklchVariableToHex("--p")}
            className="m-auto"
          />
        </div>
      ) : link.type === "url" && faviconSrc ? (
        <>
          <Image
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) {
                setLoadedFavicon(faviconSrc);
              }
            }}
            src={faviconSrc}
            width={64}
            height={64}
            alt=""
            unoptimized
            className={clsx(
              iconClasses,
              faviconLoaded ? "" : "absolute opacity-0"
            )}
            draggable="false"
            onLoad={(e) => {
              // next/image also calls onLoad when it mounts over an image the
              // browser already holds, broken or not. A site without a favicon
              // gets an empty 204, so only an image with pixels counts, or a
              // card remounted by a reorder would hide its placeholder.
              if (e.currentTarget.naturalWidth > 0)
                setLoadedFavicon(faviconSrc);
            }}
          />
          {!faviconLoaded && initialIcon}
        </>
      ) : link.type === "pdf" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses}
          icon="bi-file-earmark-pdf"
          color={siteColor}
        />
      ) : link.type === "image" ? (
        <LinkPlaceholderIcon
          iconClasses={iconClasses}
          icon="bi-file-earmark-image"
          color={siteColor}
        />
      ) : (
        // : link.type === "monolith" ? (
        //   <LinkPlaceholderIcon
        //     iconClasses={iconClasses + dimension}
        //     size={size}
        //     icon="bi-filetype-html"
        //   />
        // )
        initialIcon
      )}
    </div>
  );
}

const LinkPlaceholderIcon = ({
  iconClasses,
  icon,
  initial,
  color,
}: {
  iconClasses: string;
  icon?: string;
  initial?: string;
  color: string;
}) => {
  return (
    <div
      className={clsx(
        iconClasses,
        "aspect-square",
        initial ? "text-2xl" : "text-4xl"
      )}
      style={{ color }}
    >
      {initial ? (
        <span className="m-auto font-semibold leading-none">{initial}</span>
      ) : (
        <i className={`${icon} m-auto`}></i>
      )}
    </div>
  );
};

export default React.memo(LinkIcon);
