import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArchivedFormat } from "@/types/global";
import { useTranslation } from "next-i18next";
import ReadableView from "@/components/ReadableView";
import { useGetLink } from "@/hooks/store/links";
import clsx from "clsx";
import Link from "next/link";
import Icon from "./Icon";
import unescapeString from "@/lib/client/unescapeString";
import isValidUrl from "@/lib/shared/isValidUrl";
import { IconWeight } from "@phosphor-icons/react";
import LinkIcon from "./LinkViews/LinkComponents/LinkIcon";
import LinkDate from "./LinkViews/LinkComponents/LinkDate";
import { formatAvailable } from "@/lib/shared/formatStats";

export default function Preservation() {
  const { data: link, ...getLink } = useGetLink();
  const { t } = useTranslation();
  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");

  const [format, setFormat] = useState<ArchivedFormat>(
    Number(router.query.format)
  );

  // A useEffect that changes the query string when the format changes
  useEffect(() => {
    router.push(
      {
        query: {
          id: router.query.id,
          format: format,
        },
      },
      undefined,
      { shallow: true }
    );
  }, [format]);

  useEffect(() => {
    getLink.mutateAsync({
      id: Number(router.query.id),
      isPublicRoute: isPublicRoute,
    });

    let interval: NodeJS.Timeout | null = null;
    if (
      link &&
      (!link?.image || !link?.pdf || !link?.readable || !link?.monolith)
    ) {
      interval = setInterval(
        () =>
          getLink.mutateAsync({
            id: link.id as number,
          }),
        5000
      );
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }
  }, []);

  return (
    <div
      className={clsx(
        getLink.isPending ? "flex h-screen" : "relative",
        "max-w-screen-lg h-full mx-auto p-3"
      )}
    >
      {link?.id && (
        <div className={`flex flex-col gap-3 items-start`}>
          <div className="flex gap-3 items-start">
            <div className="flex flex-col w-full gap-1">
              <p className="md:text-4xl text-2xl pr-10">
                {unescapeString(
                  link?.name || link?.description || link?.url || ""
                )}
              </p>
              {link?.url && (
                <Link
                  href={link?.url || ""}
                  title={link?.url}
                  target="_blank"
                  className="hover:opacity-60 duration-100 break-all text-sm flex items-center gap-1 text-neutral w-fit"
                >
                  <i className="bi-link-45deg"></i>

                  {isValidUrl(link?.url || "") &&
                    new URL(link?.url as string).host}
                </Link>
              )}
            </div>
          </div>

          <p className="text-sm text-neutral mb-3 flex justify-between items-center w-full gap-2 flex-wrap">
            <LinkDate link={link} />
            <div className="flex gap-1 h-8 rounded-full bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10 w-full sm:w-fit">
              {formatAvailable(link, "pdf") && (
                <div
                  className={clsx(
                    "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold w-full text-center",
                    format === ArchivedFormat.pdf && "bg-primary bg-opacity-50"
                  )}
                  onClick={() => {
                    setFormat(ArchivedFormat.pdf);
                  }}
                >
                  {t("pdf")}
                </div>
              )}
              {formatAvailable(link, "monolith") && (
                <div
                  className={clsx(
                    "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold w-full text-center",
                    format === ArchivedFormat.monolith &&
                      "bg-primary bg-opacity-50"
                  )}
                  onClick={() => {
                    setFormat(ArchivedFormat.monolith);
                  }}
                >
                  {t("webpage")}
                </div>
              )}
              {formatAvailable(link, "readable") && (
                <div
                  className={clsx(
                    "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold w-full text-center",
                    format === ArchivedFormat.readability &&
                      "bg-primary bg-opacity-50"
                  )}
                  onClick={() => {
                    setFormat(ArchivedFormat.readability);
                  }}
                >
                  {t("readable")}
                </div>
              )}
              {formatAvailable(link, "image") && (
                <div
                  className={clsx(
                    "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold w-full text-center",
                    format ===
                      (link?.image?.endsWith("png")
                        ? ArchivedFormat.png
                        : ArchivedFormat.jpeg) && "bg-primary bg-opacity-50"
                  )}
                  onClick={() => {
                    setFormat(
                      link?.image?.endsWith("png")
                        ? ArchivedFormat.png
                        : ArchivedFormat.jpeg
                    );
                  }}
                >
                  {t("image")}
                </div>
              )}
            </div>
          </p>
        </div>
      )}
      {link?.id &&
      Number(router.query.format) === ArchivedFormat.readability ? (
        <ReadableView link={link} />
      ) : link?.id &&
        Number(router.query.format) === ArchivedFormat.monolith ? (
        <iframe
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}`}
          className="w-full h-screen border-none rounded-md"
        ></iframe>
      ) : link?.id && Number(router.query.format) === ArchivedFormat.pdf ? (
        <iframe
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.pdf}`}
          className="w-full h-screen border-none rounded-md"
        ></iframe>
      ) : link?.id && Number(router.query.format) === ArchivedFormat.png ? (
        <img
          alt=""
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.png}`}
          className="w-fit mx-auto rounded-md"
        />
      ) : link?.id && Number(router.query.format) === ArchivedFormat.jpeg ? (
        <img
          alt=""
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}`}
          className="w-fit mx-auto rounded-md"
        />
      ) : getLink.error ? (
        <p>{t("not_found_404")}</p>
      ) : (
        <></>
      )}
    </div>
  );
}
