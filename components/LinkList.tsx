import { ExtendedLink } from "@/types/global";
import {
  faFolder,
  faArrowUpRightFromSquare,
  faCaretRight,
  faEllipsis,
  faFileImage,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

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
    <div className="border border-sky-100 mb-5 bg-gray-100 p-5 rounded">
      <div className="flex justify-between h-full">
        <div>
          <div className="flex items-baseline gap-1">
            <p className="text-sm text-sky-300 font-bold">{count + 1}.</p>
            <p className="text-lg text-sky-600">{link.name}</p>
          </div>
          <p className="text-sky-400 text-sm font-medium">{link.title}</p>
          <div className="flex gap-3 items-center flex-wrap my-3">
            <div className="flex items-center gap-1 cursor-pointer">
              <FontAwesomeIcon icon={faFolder} className="w-4 text-sky-300" />
              <p className="text-sky-900">{link.collection.name}</p>
            </div>
            <div className="flex gap-1 items-center flex-wrap">
              {link.tags.map((e, i) => (
                <p
                  key={i}
                  className="px-2 py-1 bg-sky-200 text-sky-700 text-xs rounded-3xl cursor-pointer"
                >
                  # {e.name}
                </p>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <p className="text-gray-500">{formattedDate}</p>
            <FontAwesomeIcon
              icon={faCaretRight}
              className="w-3 text-gray-400"
            />
            <a href={link.url} className="group">
              <div className="text-gray-500 font-bold flex items-center gap-1">
                <p>{shortendURL}</p>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="w-3 opacity-0 group-hover:opacity-100 duration-75"
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
              >
                <FontAwesomeIcon
                  icon={faFileImage}
                  className="w-8 h-8 text-sky-600 cursor-pointer"
                />
              </a>
              <a
                href={`/api/archives/${link.collectionId}/${encodeURIComponent(
                  link.pdfPath
                )}`}
                onMouseEnter={() => setArchiveLabel("PDF")}
              >
                <FontAwesomeIcon
                  icon={faFilePdf}
                  className="w-8 h-8 text-sky-600 cursor-pointer"
                />
              </a>
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-8 h-8 text-sky-600 cursor-pointer"
                onMouseEnter={() => setArchiveLabel("Web.archive.org")}
              />
            </div>
          </div>
        </div>
      </div>
      {/* <br />
      <hr />
      <br />
      <p className="break-words text-sm">{JSON.stringify(link)}</p> */}
    </div>
  );
}
