import { formatAvailable } from "@/lib/shared/formatStats";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import DOMPurify from "dompurify";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import clsx from "clsx";
import LinkDate from "../LinkViews/LinkComponents/LinkDate";
import isValidUrl from "@/lib/shared/isValidUrl";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import usePermissions from "@/hooks/usePermissions";
import { PreservationSkeleton } from "../Skeletons";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function ReadableView({ link }: Props) {
  const { t } = useTranslation();
  const [linkContent, setLinkContent] = useState("");

  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");
  const permissions = usePermissions(link?.collection?.id as number);

  useEffect(() => {
    const fetchLinkContent = async () => {
      if (formatAvailable(link, "readable")) {
        const response = await fetch(
          `/api/v1/archives/${link?.id}?format=${ArchivedFormat.readability}&_=${link.updatedAt}`
        );
        const data = await response?.json();
        setLinkContent(data?.content || "");
      }
    };

    fetchLinkContent();
  }, [link]);

  return (
    <div className="flex flex-col gap-3 items-start p-3 max-w-screen-lg mx-auto bg-base-200 mt-10">
      <div className="flex gap-3 items-start">
        <div className="flex flex-col w-full gap-1">
          <p className="md:text-4xl text-2xl">
            {unescapeString(link?.name || link?.description || link?.url || "")}
          </p>
          {link?.url && (
            <Link
              href={link?.url || ""}
              title={link?.url}
              target="_blank"
              className="hover:opacity-60 duration-100 break-all text-sm flex items-center gap-1 text-neutral w-fit"
            >
              <i className="bi-link-45deg" />
              {isValidUrl(link?.url || "") && new URL(link?.url as string).host}
            </Link>
          )}
        </div>
      </div>

      <div className="text-sm text-neutral flex justify-between w-full gap-2">
        <LinkDate link={link} />
      </div>

      {link?.readable?.startsWith("archives") ? (
        <>
          {linkContent ? (
            <>
              <div
                className={clsx(
                  "p-3 rounded-md w-full",
                  linkContent && "bg-base-200"
                )}
              >
                <div
                  className="line-break px-1 reader-view read-only"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(linkContent),
                  }}
                />
              </div>
            </>
          ) : (
            <PreservationSkeleton />
          )}
        </>
      ) : (
        <div className={`w-full h-full flex flex-col justify-center`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="w-1/4 min-w-[7rem] max-w-[15rem] h-auto mx-auto mb-5"
            viewBox="0 0 16 16"
          >
            <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.598.598 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.598.598 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.598.598 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535L7.733.063z" />
            <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.598.598 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.659z" />
          </svg>
          <p className="text-center text-2xl">
            {t("link_preservation_in_queue")}
          </p>
          <p className="text-center text-lg mt-2">{t("check_back_later")}</p>
        </div>
      )}
    </div>
  );
}
