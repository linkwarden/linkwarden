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

type LinkContent = {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
};

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function ReadableView({ link }: Props) {
  const { t } = useTranslation();
  const [linkContent, setLinkContent] = useState<LinkContent>();

  const router = useRouter();

  useEffect(() => {
    const fetchLinkContent = async () => {
      if (router.query.id && formatAvailable(link, "readable")) {
        const response = await fetch(
          `/api/v1/archives/${link?.id}?format=${ArchivedFormat.readability}`
        );

        const data = await response?.json();

        setLinkContent(data);
      }
    };

    fetchLinkContent();
  }, [link]);

  return (
    <div
      className={clsx(
        "flex flex-col gap-5 h-full rounded-md p-3",
        linkContent?.content && "bg-base-200"
      )}
    >
      {link?.readable?.startsWith("archives") ? (
        <>
          {linkContent?.content ? (
            <div
              className="line-break px-1 reader-view"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(linkContent?.content || "") || "",
              }}
            ></div>
          ) : (
            <div className="p-5 m-auto w-full flex flex-col items-center gap-5">
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
              <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
            </div>
          )}
        </>
      ) : (
        <div
          className={`w-full h-full flex flex-col justify-center p-10 ${
            !link?.readable ? "skeleton" : ""
          }`}
        >
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
