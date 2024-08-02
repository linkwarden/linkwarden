import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import React from "react";

export default function LinkReadingTime({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  if (!link.readingTime) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-neutral min-w-fit">
      <i className="bi-stopwatch text-lg"></i>
      <p className="whitespace-nowrap">
        {link.readingTime} min{link.readingTime > 1 ? "s" : ""}
      </p>
    </div>
  );
}
