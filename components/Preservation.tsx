import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArchivedFormat } from "@/types/global";
import { useTranslation } from "next-i18next";
import ReadableView from "@/components/ReadableView";
import { useGetLink } from "@/hooks/store/links";
import clsx from "clsx";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import isValidUrl from "@/lib/shared/isValidUrl";
import LinkDate from "./LinkViews/LinkComponents/LinkDate";
import { formatAvailable } from "@/lib/shared/formatStats";

export default function Preservation() {
  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");

  const { data: link, mutateAsync: fetchLink, error } = useGetLink();
  const { t } = useTranslation();

  const [format, setFormat] = useState<ArchivedFormat>(
    Number(router.query.format)
  );

  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    router.push(
      {
        query: { id: router.query.id, format },
      },
      undefined,
      { shallow: true }
    );

    setPdfLoaded(false);
    setMonolithLoaded(false);
    setImageLoaded(false);
  }, [format]);

  useEffect(() => {
    fetchLink({
      id: Number(router.query.id),
      isPublicRoute,
    });

    let interval: NodeJS.Timeout | null = null;
    if (
      link &&
      (!link?.image || !link?.pdf || !link?.readable || !link?.monolith)
    ) {
      interval = setInterval(() => {
        fetchLink({ id: link.id as number });
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

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

    switch (Number(router.query.format)) {
      case ArchivedFormat.readability:
        return (
          <div className="overflow-auto w-full h-full">
            <ReadableView link={link} />
          </div>
        );

      case ArchivedFormat.monolith:
        return (
          <>
            {!monolithLoaded && <Skeleton />}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}`}
              className={clsx(
                "w-full border-none",
                monolithLoaded ? "block" : "hidden",
                isExpanded ? "h-full" : "h-[calc(100vh-4.5rem)]"
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
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.pdf}`}
              className={clsx(
                "w-full border-none",
                pdfLoaded ? "block" : "hidden",
                isExpanded ? "h-full" : "h-[calc(100vh-4.5rem)]"
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
                src={`/api/v1/archives/${link.id}?format=${Number(
                  router.query.format
                )}`}
                className={clsx(
                  "w-fit h-auto mx-auto", // Ensure block display and proper resizing
                  !imageLoaded && "hidden"
                )}
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

  return (
    <div
      className={clsx(
        !isExpanded && "max-w-screen-lg mx-auto p-3 relative",
        isExpanded && "fixed inset-0 w-screen h-screen z-50"
      )}
      style={{
        overflow: isExpanded ? "hidden" : "visible",
      }}
    >
      {!isExpanded && link?.id && (
        <div className="text-sm text-neutral mb-3 flex justify-between items-center w-full gap-2">
          <div className="flex gap-1 h-8 rounded-full bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10">
            {formatAvailable(link, "pdf") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold text-center flex justify-between items-center",
                  format === ArchivedFormat.pdf && "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.pdf)}
              >
                <div className="tooltip tooltip-bottom" data-tip={t("pdf")}>
                  <i className={`bi-file-earmark-pdf text-lg`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "monolith") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold text-center flex justify-between items-center",
                  format === ArchivedFormat.monolith &&
                    "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.monolith)}
              >
                <div className="tooltip tooltip-bottom" data-tip={t("webpage")}>
                  <i className={`bi-filetype-html text-lg`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "readable") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold text-center flex justify-between items-center",
                  format === ArchivedFormat.readability &&
                    "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.readability)}
              >
                <div
                  className="tooltip tooltip-bottom"
                  data-tip={t("readable")}
                >
                  <i className={`bi-file-earmark-text text-lg`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "image") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold text-center flex justify-between items-center",
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
                  <i className={`bi-file-earmark-image text-lg`} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div onClick={handleDownload} className="btn btn-sm btn-circle">
              <i className="bi-cloud-arrow-down text-xl text-neutral" />
            </div>
            <div
              className="btn btn-circle btn-sm"
              onClick={() => setIsExpanded(true)}
            >
              <i className="bi-arrows-angle-expand" />
            </div>
          </div>
        </div>
      )}

      {error ? (
        <p>{t("not_found_404")}</p>
      ) : (
        <div className={clsx("w-full", isExpanded ? "h-full" : "h-auto")}>
          {renderFormat()}
        </div>
      )}

      {isExpanded && (
        <div
          className="absolute top-3 right-3 btn btn-circle btn-sm"
          onClick={() => setIsExpanded(false)}
        >
          <i className="bi-arrows-angle-contract" />
        </div>
      )}
    </div>
  );
}
