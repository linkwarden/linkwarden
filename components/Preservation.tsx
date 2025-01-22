import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useTranslation } from "next-i18next";
import ReadableView from "@/components/ReadableView";
import clsx from "clsx";
import { formatAvailable } from "@/lib/shared/formatStats";
import useWindowDimensions from "@/hooks/useWindowDimensions";

export default function Preservation({
  link,
  standalone,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  standalone?: boolean;
}) {
  const { t } = useTranslation();

  const [format, setFormat] = useState<ArchivedFormat>();

  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setPdfLoaded(false);
    setMonolithLoaded(false);
    setImageLoaded(false);
  }, [format]);

  const Skeleton = () => (
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
  );

  const renderFormat = () => {
    if (!link?.id) return null;

    switch (format) {
      case ArchivedFormat.readability:
        return (
          <div className="overflow-auto w-full h-full">
            <ReadableView
              link={link}
              isExpanded={isExpanded}
              standalone={standalone}
            />
          </div>
        );

      case ArchivedFormat.monolith:
        return (
          <>
            {!monolithLoaded && <Skeleton />}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${
                ArchivedFormat.monolith
              }&_=${Date.now()}`}
              className={clsx(
                "w-full border-none",
                monolithLoaded ? "block" : "hidden",
                isExpanded ? "h-full" : "h-[calc(80vh-3.75rem)]"
              )}
              onLoad={() => setMonolithLoaded(true)}
            />
          </>
        );

      case ArchivedFormat.pdf:
        return (
          <>
            {!pdfLoaded && <Skeleton />}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${
                ArchivedFormat.pdf
              }&_=${Date.now()}`}
              className={clsx(
                "w-full border-none",
                pdfLoaded ? "block" : "hidden",
                isExpanded ? "h-full" : "h-[calc(80vh-3.75rem)]"
              )}
              onLoad={() => setPdfLoaded(true)}
            />
          </>
        );

      case ArchivedFormat.png:
      case ArchivedFormat.jpeg:
        return (
          <>
            {!imageLoaded && <Skeleton />}
            <div className="overflow-auto w-fit mx-auto h-full">
              <img
                alt=""
                src={`/api/v1/archives/${link.id}?format=${format}`}
                className={clsx("w-fit mx-auto", !imageLoaded && "hidden")}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleDownload = () => {
    const path = `/api/v1/archives/${link?.id}?format=${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          const anchorElement = document.createElement("a");
          anchorElement.href = path;
          anchorElement.download =
            format === ArchivedFormat.monolith
              ? "Webpage"
              : format === ArchivedFormat.pdf
                ? "PDF"
                : format === ArchivedFormat.readability
                  ? "Readable"
                  : "Screenshot";
          anchorElement.click();
        } else {
          console.error("Failed to download file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const { width } = useWindowDimensions();

  const content = (
    <div
      className={clsx(
        "bg-base-200",
        !isExpanded &&
          `mx-auto relative p-2 h-full overflow-auto ${
            width < 640 && "rounded-md"
          }`,
        isExpanded && "fixed inset-0 w-screen h-screen z-[9999]"
      )}
      style={{
        pointerEvents: "auto",
      }}
    >
      {!isExpanded && link?.id && (
        <div className="text-sm text-neutral mb-3 flex justify-between items-center w-full gap-2">
          <div className="flex gap-1 h-8 rounded-xl bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10">
            {formatAvailable(link, "pdf") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format === ArchivedFormat.pdf && "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.pdf)}
              >
                <div className="tooltip tooltip-bottom" data-tip={t("pdf")}>
                  <i className={`bi-file-earmark-pdf text-lg -ml-[0.3rem]`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "monolith") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format === ArchivedFormat.monolith &&
                    "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.monolith)}
              >
                <div className="tooltip tooltip-bottom" data-tip={t("webpage")}>
                  <i className={`bi-filetype-html text-lg -ml-[0.3rem]`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "readable") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format === ArchivedFormat.readability &&
                    "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.readability)}
              >
                <div
                  className="tooltip tooltip-bottom"
                  data-tip={t("readable")}
                >
                  <i className={`bi-file-earmark-text text-lg -ml-[0.3rem]`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "image") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format ===
                    (link?.image?.endsWith("png")
                      ? ArchivedFormat.png
                      : ArchivedFormat.jpeg) && "bg-primary bg-opacity-50"
                )}
                onClick={() =>
                  setFormat(
                    link?.image?.endsWith("png")
                      ? ArchivedFormat.png
                      : ArchivedFormat.jpeg
                  )
                }
              >
                <div className="tooltip tooltip-bottom" data-tip={t("image")}>
                  <i className={`bi-file-earmark-image text-lg -ml-[0.3rem]`} />
                </div>
              </div>
            )}
          </div>

          {format !== undefined && (
            <div className="flex gap-2">
              <div
                onClick={handleDownload}
                className="btn btn-sm btn-square btn-ghost"
              >
                <i className="bi-cloud-arrow-down text-xl" />
              </div>
              <div
                className="btn btn-square btn-ghost btn-sm"
                onClick={() => setIsExpanded(true)}
              >
                <i className="bi-arrows-angle-expand" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={clsx("w-full", isExpanded ? "h-full" : "h-auto")}>
        {renderFormat()}
      </div>

      {isExpanded && (
        <div
          className="absolute top-3 right-3 btn btn-circle btn-primary btn-sm"
          onClick={() => setIsExpanded(false)}
        >
          <i className="bi-arrows-angle-contract text-lg" />
        </div>
      )}
    </div>
  );

  if (isExpanded) {
    return ReactDOM.createPortal(content, document.body);
  }

  return content;
}
