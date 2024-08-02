import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import React from "react";

export default function LinkDate({
  link,
  month = "short",
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  month?: "short" | "long";
}) {
  const formattedDate = new Date(
    (link.importDate || link.createdAt) as string
  ).toLocaleString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-1 text-neutral min-w-fit">
      <i className="bi-calendar3 text-lg"></i>
      <p>{formattedDate}</p>
    </div>
  );
}
