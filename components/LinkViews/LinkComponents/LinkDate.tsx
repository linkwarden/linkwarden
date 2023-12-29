import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import React from "react";

export default function LinkDate({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div className="flex items-center gap-1 text-neutral">
      <i className="bi-calendar3 text-lg"></i>
      <p>{formattedDate}</p>
    </div>
  );
}
