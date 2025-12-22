import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

function LinkTypeBadge({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (link.type === "url" && link.url) {
      try {
        setUrl(new URL(link.url).host.toLowerCase());
      } catch (error) {
        console.log(error);
      }
    }
  }, [link]);

  const typeIcon = () => {
    switch (link.type) {
      case "pdf":
        return "bi-file-earmark-pdf";
      case "image":
        return "bi-file-earmark-image";
      default:
        return "bi-link-45deg";
    }
  };

  return link.url && url ? (
    <Link
      href={link.url || ""}
      target="_blank"
      title={link.url || ""}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="flex gap-1 item-center select-none text-neutral hover:opacity-70 duration-100 max-w-full w-fit"
    >
      <i className="bi-link-45deg text-lg leading-none"></i>
      <p className="text-xs truncate">{url}</p>
    </Link>
  ) : (
    <div className="flex gap-1 item-center select-none text-neutral duration-100 max-w-full w-fit">
      <i className={typeIcon() + ` text-md leading-none`}></i>
      <p className="text-xs truncate">{link.type}</p>
    </div>
  );
}

export default React.memo(LinkTypeBadge);
