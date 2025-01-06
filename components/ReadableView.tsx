import unescapeString from "@/lib/client/unescapeString";
import { formatAvailable } from "@/lib/shared/formatStats";
import isValidUrl from "@/lib/shared/isValidUrl";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import ColorThief, { RGBColor } from "colorthief";
import DOMPurify from "dompurify";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { useGetLink } from "@/hooks/store/links";
import { IconWeight } from "@phosphor-icons/react";
import Icon from "./Icon";

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
  const [imageError, setImageError] = useState<boolean>(false);
  const [colorPalette, setColorPalette] = useState<RGBColor[]>();

  const [date, setDate] = useState<Date | string>();

  const colorThief = new ColorThief();

  const router = useRouter();

  const getLink = useGetLink();

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

    setDate(link.importDate || link.createdAt);
  }, [link]);

  useEffect(() => {
    if (link) getLink.mutateAsync({ id: link.id as number });

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

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [link?.image, link?.pdf, link?.readable, link?.monolith]);

  const rgbToHex = (r: number, g: number, b: number): string =>
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("");

  useEffect(() => {
    const banner = document.getElementById("link-banner");
    const bannerInner = document.getElementById("link-banner-inner");

    if (colorPalette && banner && bannerInner) {
      if (colorPalette[0] && colorPalette[1]) {
        banner.style.background = `linear-gradient(to bottom, ${rgbToHex(
          colorPalette[0][0],
          colorPalette[0][1],
          colorPalette[0][2]
        )}20, ${rgbToHex(
          colorPalette[1][0],
          colorPalette[1][1],
          colorPalette[1][2]
        )}20)`;
      }

      if (colorPalette[2] && colorPalette[3]) {
        bannerInner.style.background = `linear-gradient(to bottom, ${rgbToHex(
          colorPalette[2][0],
          colorPalette[2][1],
          colorPalette[2][2]
        )}30, ${rgbToHex(
          colorPalette[3][0],
          colorPalette[3][1],
          colorPalette[3][2]
        )})30`;
      }
    }
  }, [colorPalette]);

  return (
    <div className={`flex flex-col max-w-screen-md h-full mx-auto p-5`}>
      <div
        id="link-banner"
        className="link-banner relative bg-opacity-10 border-neutral-content p-3 border mb-3"
      >
        <div id="link-banner-inner" className="link-banner-inner"></div>

        <div className={`flex flex-col gap-3 items-start`}>
          <div className="flex gap-3 items-start">
            {!imageError && link?.url && (
              <Image
                src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=32`}
                width={42}
                height={42}
                alt=""
                id={"favicon-" + link.id}
                className="bg-white shadow rounded-md p-1 select-none mt-1"
                draggable="false"
                onLoad={(e) => {
                  try {
                    const color = colorThief.getPalette(
                      e.target as HTMLImageElement,
                      4
                    );

                    setColorPalette(color);
                  } catch (err) {
                    console.log(err);
                  }
                }}
                onError={(e) => {
                  setImageError(true);
                }}
              />
            )}
            <div className="flex flex-col">
              <p className="text-xl pr-10">
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

          <div className="flex gap-1 items-center flex-wrap">
            <Link
              href={`/collections/${link?.collection.id}`}
              className="flex items-center gap-1 cursor-pointer hover:opacity-60 duration-100 mr-2 z-10"
            >
              {link.collection.icon ? (
                <Icon
                  icon={link.collection.icon}
                  size={30}
                  weight={
                    (link.collection.iconWeight || "regular") as IconWeight
                  }
                  color={link.collection.color}
                />
              ) : (
                <i
                  className="bi-folder-fill text-2xl"
                  style={{ color: link.collection.color }}
                ></i>
              )}
              <p
                title={link?.collection.name}
                className="text-lg truncate max-w-[12rem]"
              >
                {link?.collection.name}
              </p>
            </Link>
            {link?.tags?.map((e, i) => (
              <Link key={i} href={`/tags/${e.id}`} className="z-10">
                <p
                  title={e.name}
                  className="btn btn-xs btn-ghost truncate max-w-[19rem]"
                >
                  #{e.name}
                </p>
              </Link>
            ))}
          </div>

          <p className="min-w-fit text-sm text-neutral">
            {date
              ? new Date(date).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : undefined}
          </p>

          {link?.name ? <p>{unescapeString(link?.description)}</p> : undefined}
        </div>
      </div>

      <div className="flex flex-col gap-5 h-full">
        {link?.readable?.startsWith("archives") ? (
          <div
            className="line-break px-1 reader-view"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(linkContent?.content || "") || "",
            }}
          ></div>
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
    </div>
  );
}
