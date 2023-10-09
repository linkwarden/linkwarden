import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import Image from "next/image";
import ColorThief, { RGBColor } from "colorthief";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faBoxArchive,
  faCloudArrowDown,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import {
  faCalendarDays,
  faFileImage,
  faFilePdf,
} from "@fortawesome/free-regular-svg-icons";
import isValidUrl from "@/lib/client/isValidUrl";
import { useTheme } from "next-themes";
import unescapeString from "@/lib/client/unescapeString";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  isOwnerOrMod: boolean;
};

export default function LinkDetails({ link, isOwnerOrMod }: Props) {
  const { theme } = useTheme();

  const [imageError, setImageError] = useState<boolean>(false);
  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const { collections } = useCollectionStore();

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );
  }, [collections]);

  const [colorPalette, setColorPalette] = useState<RGBColor[]>();

  const colorThief = new ColorThief();

  const url = isValidUrl(link.url) ? new URL(link.url) : undefined;

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
      banner.style.background = `linear-gradient(to right, ${rgbToHex(
        colorPalette[0][0],
        colorPalette[0][1],
        colorPalette[0][2]
      )}, ${rgbToHex(
        colorPalette[1][0],
        colorPalette[1][1],
        colorPalette[1][2]
      )})`;

      bannerInner.style.background = `linear-gradient(to right, ${rgbToHex(
        colorPalette[2][0],
        colorPalette[2][1],
        colorPalette[2][2]
      )}, ${rgbToHex(
        colorPalette[3][0],
        colorPalette[3][1],
        colorPalette[3][2]
      )})`;
    }
  }, [colorPalette, theme]);

  const handleDownload = (format: "png" | "pdf") => {
    const path = `/api/archives/${link.collection.id}/${link.id}.${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          // Create a temporary link and click it to trigger the download
          const link = document.createElement("a");
          link.href = path;
          link.download = format === "pdf" ? "PDF" : "Screenshot";
          link.click();
        } else {
          console.error("Failed to download file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div
      className={`flex flex-col gap-3 sm:w-[35rem] w-80 ${
        isOwnerOrMod ? "" : "mt-12"
      } ${theme === "dark" ? "banner-dark-mode" : "banner-light-mode"}`}
    >
      {!imageError && (
        <div id="link-banner" className="link-banner h-32 -mx-5 -mt-5 relative">
          <div id="link-banner-inner" className="link-banner-inner"></div>
        </div>
      )}
      <div
        className={`relative flex gap-5 items-start ${!imageError && "-mt-24"}`}
      >
        {!imageError && url && (
          <Image
            src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
            width={42}
            height={42}
            alt=""
            id={"favicon-" + link.id}
            className="select-none mt-2 w-10 rounded-md shadow border-[3px] border-white dark:border-neutral-900 bg-white dark:bg-neutral-900 aspect-square"
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
        <div className="flex w-full flex-col min-h-[3rem] justify-center drop-shadow">
          <p className="text-2xl text-black dark:text-white capitalize break-words hyphens-auto">
            {unescapeString(link.name)}
          </p>
          <Link
            href={link.url}
            target="_blank"
            className={`${
              link.name ? "text-sm" : "text-xl"
            } text-gray-500 dark:text-gray-300 break-all hover:underline cursor-pointer w-fit`}
          >
            {url ? url.host : link.url}
          </Link>
        </div>
      </div>
      <div className="flex gap-1 items-center flex-wrap">
        <Link
          href={`/collections/${link.collection.id}`}
          className="flex items-center gap-1 cursor-pointer hover:opacity-60 duration-100 mr-2 z-10"
        >
          <FontAwesomeIcon
            icon={faFolder}
            className="w-5 h-5 drop-shadow"
            style={{ color: collection?.color }}
          />
          <p
            title={collection?.name}
            className="text-black dark:text-white text-lg truncate max-w-[12rem]"
          >
            {collection?.name}
          </p>
        </Link>
        {link.tags.map((e, i) => (
          <Link key={i} href={`/tags/${e.id}`} className="z-10">
            <p
              title={e.name}
              className="px-2 py-1 bg-sky-200 text-black dark:text-white dark:bg-sky-900 text-xs rounded-3xl cursor-pointer hover:opacity-60 duration-100 truncate max-w-[19rem]"
            >
              {e.name}
            </p>
          </Link>
        ))}
      </div>
      {link.description && (
        <>
          <div className="text-black dark:text-white max-h-[20rem] my-3 rounded-md overflow-y-auto hyphens-auto">
            {unescapeString(link.description)}
          </div>
        </>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
          <FontAwesomeIcon icon={faBoxArchive} className="w-4 h-4" />
          <p>Archived Formats:</p>
        </div>
        <div
          className="flex items-center gap-1 text-gray-500 dark:text-gray-300"
          title={"Created at: " + formattedDate}
        >
          <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
          <p>{formattedDate}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center p-2 border border-sky-100 dark:border-neutral-700 rounded-md">
          <div className="flex gap-2 items-center">
            <div className="text-white bg-sky-300 dark:bg-sky-600 p-2 rounded-md">
              <FontAwesomeIcon icon={faFileImage} className="w-6 h-6" />
            </div>

            <p className="text-black dark:text-white">Screenshot</p>
          </div>

          <div className="flex text-black dark:text-white gap-1">
            <Link
              href={`/api/archives/${link.collectionId}/${link.id}.png`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-5 h-5 text-sky-500 dark:text-sky-500"
              />
            </Link>

            <div
              onClick={() => handleDownload("png")}
              className="cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faCloudArrowDown}
                className="w-5 h-5 cursor-pointer text-sky-500 dark:text-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-2 border border-sky-100 dark:border-neutral-700 rounded-md">
          <div className="flex gap-2 items-center">
            <div className="text-white bg-sky-300 dark:bg-sky-600 p-2 rounded-md">
              <FontAwesomeIcon icon={faFilePdf} className="w-6 h-6" />
            </div>

            <p className="text-black dark:text-white">PDF</p>
          </div>

          <div className="flex text-black dark:text-white gap-1">
            <Link
              href={`/api/archives/${link.collectionId}/${link.id}.pdf`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-5 h-5 text-sky-500 dark:text-sky-500"
              />
            </Link>

            <div
              onClick={() => handleDownload("pdf")}
              className="cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faCloudArrowDown}
                className="w-5 h-5 cursor-pointer text-sky-500 dark:text-sky-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
