import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCloudArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { faFileImage, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import useLinkStore from "@/store/links";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function PreservedFormats() {
  const session = useSession();
  const { links, getLink } = useLinkStore();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  const router = useRouter();

  useEffect(() => {
    if (links) setLink(links.find((e) => e.id === Number(router.query.id)));
  }, [links]);

  useEffect(() => {
    let interval: NodeJS.Timer | undefined;
    if (link?.screenshotPath === "pending" || link?.pdfPath === "pending") {
      interval = setInterval(() => getLink(link.id as number), 5000);
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
  }, [link?.screenshotPath, link?.pdfPath, link?.readabilityPath]);

  const updateArchive = async () => {
    const load = toast.loading("Sending request...");

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();

    toast.dismiss(load);

    if (response.ok) {
      toast.success(`Link is being archived...`);
      getLink(link?.id as number);
    } else toast.error(data.response);
  };

  const handleDownload = (format: "png" | "pdf") => {
    const path = `/api/v1/archives/${link?.collection.id}/${link?.id}.${format}`;
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
    <div className={`flex flex-col gap-3 sm:w-[35rem] w-80 pt-3`}>
      {link?.screenshotPath && link?.screenshotPath !== "pending" ? (
        <div className="flex justify-between items-center pr-1 border border-sky-100 dark:border-neutral-700 rounded-md">
          <div className="flex gap-2 items-center">
            <div className="text-white bg-sky-300 dark:bg-sky-600 p-2 rounded-l-md">
              <FontAwesomeIcon icon={faFileImage} className="w-6 h-6" />
            </div>

            <p className="text-black dark:text-white">Screenshot</p>
          </div>

          <div className="flex text-black dark:text-white gap-1">
            <div
              onClick={() => handleDownload("png")}
              className="cursor-pointer hover:opacity-60 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faCloudArrowDown}
                className="w-5 h-5 cursor-pointer text-gray-500 dark:text-gray-300"
              />
            </div>

            <Link
              href={`/api/v1/archives/${link.collectionId}/${link.id}.png`}
              target="_blank"
              className="cursor-pointer hover:opacity-60 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-5 h-5 text-gray-500 dark:text-gray-300"
              />
            </Link>
          </div>
        </div>
      ) : undefined}

      {link?.pdfPath && link.pdfPath !== "pending" ? (
        <div className="flex justify-between items-center pr-1 border border-sky-100 dark:border-neutral-700 rounded-md">
          <div className="flex gap-2 items-center">
            <div className="text-white bg-sky-300 dark:bg-sky-600 p-2 rounded-l-md">
              <FontAwesomeIcon icon={faFilePdf} className="w-6 h-6" />
            </div>

            <p className="text-black dark:text-white">PDF</p>
          </div>

          <div className="flex text-black dark:text-white gap-1">
            <div
              onClick={() => handleDownload("pdf")}
              className="cursor-pointer hover:opacity-60 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faCloudArrowDown}
                className="w-5 h-5 cursor-pointer text-gray-500 dark:text-gray-300"
              />
            </div>

            <Link
              href={`/api/v1/archives/${link.collectionId}/${link.id}.pdf`}
              target="_blank"
              className="cursor-pointer hover:opacity-60 duration-100 p-2 rounded-md"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-5 h-5 text-gray-500 dark:text-gray-300"
              />
            </Link>
          </div>
        </div>
      ) : undefined}

      <div className="flex flex-col-reverse sm:flex-row gap-5 items-center justify-center">
        {link?.collection.ownerId === session.data?.user.id ? (
          <div
            className={`w-full text-center bg-sky-700 p-1 rounded-md cursor-pointer select-none hover:bg-sky-600 duration-100 ${
              link?.pdfPath &&
              link?.screenshotPath &&
              link?.pdfPath !== "pending" &&
              link?.screenshotPath !== "pending"
                ? "mt-3"
                : ""
            }`}
            onClick={() => updateArchive()}
          >
            <p>Update Preserved Formats</p>
            <p className="text-xs">(Refresh Formats)</p>
          </div>
        ) : undefined}
        <Link
          href={`https://web.archive.org/web/${link?.url.replace(
            /(^\w+:|^)\/\//,
            ""
          )}`}
          target="_blank"
          className={`text-gray-500 dark:text-gray-300 duration-100 hover:opacity-60 flex gap-2 w-fit items-center text-sm ${
            link?.pdfPath &&
            link?.screenshotPath &&
            link?.pdfPath !== "pending" &&
            link?.screenshotPath !== "pending"
              ? "sm:mt-3"
              : ""
          }`}
        >
          <FontAwesomeIcon
            icon={faArrowUpRightFromSquare}
            className="w-4 h-4"
          />
          <p className="whitespace-nowrap">
            View Latest Snapshot on archive.org
          </p>
        </Link>
      </div>
    </div>
  );
}
