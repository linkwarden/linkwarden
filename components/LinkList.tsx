import { ExtendedLink } from "@/types/global";
import {
  faFolder,
  faArrowUpRightFromSquare,
  faEllipsis,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faFileImage, faFilePdf } from "@fortawesome/free-regular-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Image from "next/image";

export default function ({
  link,
  count,
}: {
  link: ExtendedLink;
  count: number;
}) {
  const [archiveLabel, setArchiveLabel] = useState("Archived Formats");

  const shortendURL = new URL(link.url).host.toLowerCase();
  const formattedDate = new Date(link.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-sky-100 mb-5 bg-gray-100 p-5 rounded flex items-center gap-5 group/item">
      <Image
        src={`http://icons.duckduckgo.com/ip3/${shortendURL}.ico`}
        width={100}
        height={100}
        alt=""
        className="blur-sm opacity-80 group-hover/item:opacity-100 duration-100"
        draggable="false"
      />
      <div className="flex justify-between gap-5 w-full">
        <div>
          <div className="flex items-baseline gap-1">
            <p className="text-sm text-sky-300 font-bold">{count + 1}.</p>
            <p className="text-lg text-sky-600">{link.name}</p>
            {link.isFavorites ? (
              <FontAwesomeIcon icon={faHeart} className="w-3 text-red-600" />
            ) : null}
          </div>
          <p className="text-sky-400 text-sm font-medium">{link.title}</p>
          <div className="flex gap-3 items-center flex-wrap my-3">
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 duration-100">
              <FontAwesomeIcon icon={faFolder} className="w-4 text-sky-300" />
              <p className="text-sky-900">{link.collection.name}</p>
            </div>
            <div className="flex gap-1 items-center flex-wrap">
              {link.tags.map((e, i) => (
                <p
                  key={i}
                  className="px-2 py-1 bg-sky-200 text-sky-700 text-xs rounded-3xl cursor-pointer hover:bg-sky-100 duration-100"
                >
                  # {e.name}
                </p>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <p className="text-gray-500">{formattedDate}</p>
            <a href={link.url} target="_blank" className="group/url">
              <div className="text-gray-500 font-bold flex items-center gap-1">
                <p>{shortendURL}</p>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="w-3 opacity-0 group-hover/url:opacity-100 duration-75"
                />
              </div>
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-between items-end">
          <FontAwesomeIcon
            icon={faEllipsis}
            className="w-6 h-6 text-gray-500 cursor-pointer"
          />
          <div>
            <p className="text-center text-sky-500 text-sm font-bold">
              {archiveLabel}
            </p>

            <div
              className="flex justify-between mt-3 gap-3"
              onMouseLeave={() => setArchiveLabel("Archived Formats")}
            >
              <a
                href={`/api/archives/${link.collectionId}/${encodeURIComponent(
                  link.screenshotPath
                )}`}
                onMouseEnter={() => setArchiveLabel("Screenshot")}
                target="_blank"
              >
                <FontAwesomeIcon
                  icon={faFileImage}
                  className="w-8 h-8 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                />
              </a>
              <a
                href={`/api/archives/${link.collectionId}/${encodeURIComponent(
                  link.pdfPath
                )}`}
                target="_blank"
                onMouseEnter={() => setArchiveLabel("PDF")}
              >
                <FontAwesomeIcon
                  icon={faFilePdf}
                  className="w-8 h-8 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                />
              </a>
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-8 h-8 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                onMouseEnter={() => setArchiveLabel("Wayback Machine")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
