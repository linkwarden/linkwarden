import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import Image from "next/image";
import isValidUrl from "@/lib/shared/isValidUrl";
import React from "react";
import Icon from "@/components/Icon";
import { IconWeight } from "@phosphor-icons/react";
import clsx from "clsx";

export default function LinkIcon({
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
    "rounded flex item-center justify-center shadow select-none z-10 w-12 h-12",
    !hideBackground && "rounded-md bg-white backdrop-blur-lg bg-opacity-50 p-1",
    className
  );

  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const [showFavicon, setShowFavicon] = React.useState<boolean>(true);

  return (
    <div onClick={() => onClick && onClick()}>
      {link.icon ? (
        <div className={iconClasses}>
          <Icon
            icon={link.icon}
            size={30}
            weight={(link.iconWeight || "regular") as IconWeight}
            color={link.color || "#006796"}
            className="m-auto"
          />
        </div>
      ) : link.type === "url" && url ? (
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
      ) : // : link.type === "monolith" ? (
      //   <LinkPlaceholderIcon
      //     iconClasses={iconClasses + dimension}
      //     size={size}
      //     icon="bi-filetype-html"
      //   />
      // )
      undefined}
    </div>
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
    <div className={clsx(iconClasses, "aspect-square text-4xl text-[#006796]")}>
      <i className={`${icon} m-auto`}></i>
    </div>
  );
};
