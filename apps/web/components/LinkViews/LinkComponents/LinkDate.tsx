import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import React from "react";
import { useUser } from "@linkwarden/router/user";

function LinkDate({ link }: { link: LinkIncludingShortenedCollectionAndTags }) {
  const { data: user } = useUser();
  const date = user?.usePublicationDate
    ? link.publishedAt || link.importDate || link.createdAt
    : link.importDate || link.createdAt;

  const formattedDate = new Date(date as string).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-1 text-neutral min-w-fit">
      <i className="bi-calendar3 text-"></i>
      <p>{formattedDate}</p>
    </div>
  );
}

export default React.memo(LinkDate);
