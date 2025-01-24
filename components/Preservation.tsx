import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import ReadableView from "@/components/ReadableView";
import clsx from "clsx";
import { formatAvailable } from "@/lib/shared/formatStats";
import { PreservationSkeleton } from "./Skeletons";
import remToPixels from "@/lib/client/remToPixels";
import { useReducedMotion } from "framer-motion";

export default function Preservation({
  link,
  standalone,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  standalone?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [format, setFormat] = useState<ArchivedFormat>();
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [delayPassed, setDelayPassed] = useState(false); // for the modal animation

  useEffect(() => {
    const delay = setTimeout(() => {
      setDelayPassed(true);
    }, 250);

    return () => {
      clearTimeout(delay);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const determineDefaultFormat = () => {
    if (formatAvailable(link, "readable")) return ArchivedFormat.readability;
    if (formatAvailable(link, "monolith")) return ArchivedFormat.monolith;
    if (formatAvailable(link, "image")) {
      return link?.image?.endsWith("png")
        ? ArchivedFormat.png
        : ArchivedFormat.jpeg;
    }
    if (formatAvailable(link, "pdf")) return ArchivedFormat.pdf;
    return undefined;
  };

  const defaultFormat = useMemo(() => determineDefaultFormat(), [link]);

  useEffect(() => {
    const { format: routeFormat, expanded: routeIsExpanded } = router.query;

    const formatNumber = Number(routeFormat);

    if (routeFormat && Object.values(ArchivedFormat).includes(formatNumber)) {
      setFormat(formatNumber);
    } else {
      setFormat(defaultFormat);
    }

    if (routeIsExpanded === "true") {
      setIsExpanded(true);
    }
  }, [router.query, link]);

  const prevFormatRef = useRef<ArchivedFormat | undefined>(undefined);

  useEffect(() => {
    if (prevFormatRef.current !== format) {
      setPdfLoaded(false);
      setMonolithLoaded(false);
      setImageLoaded(false);

      prevFormatRef.current = format;
    }
  }, [format]);

  useEffect(() => {
    if (router.pathname.includes("links")) {
      const query = {
        ...router.query,
        format,
        expanded: isExpanded,
      };
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  }, [format, isExpanded]);

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
      ref={containerRef}
      className={clsx(
        "bg-base-200",
        !isExpanded &&
          `mx-auto relative p-2 h-full overflow-auto rounded-md sm:rounded-none`,
        isExpanded && "fixed inset-0 w-screen h-screen z-[9999]"
      )}
      style={{
        pointerEvents: "auto",
      }}
    >
      {!isExpanded && link?.id && (
        <div className="text-sm text-neutral mb-3 flex justify-between items-center w-full gap-2">
          <div className="flex gap-1 h-8 rounded-xl bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10">
            {formatAvailable(link, "readable") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format === ArchivedFormat.readability &&
                    "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.readability)}
              >
                <div title={t("readable")}>
                  <i className={`bi-file-earmark-text text-lg -ml-[0.3rem]`} />
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
                <div title={t("webpage")}>
                  <i className={`bi-filetype-html text-lg -ml-[0.3rem]`} />
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
                <div title={t("image")}>
                  <i className={`bi-file-earmark-image text-lg -ml-[0.3rem]`} />
                </div>
              </div>
            )}
            {formatAvailable(link, "pdf") && (
              <div
                className={clsx(
                  "py-1 px-2 cursor-pointer duration-100 rounded-lg font-semibold text-center flex justify-between items-center w-6",
                  format === ArchivedFormat.pdf && "bg-primary bg-opacity-50"
                )}
                onClick={() => setFormat(ArchivedFormat.pdf)}
              >
                <div title={t("pdf")}>
                  <i className={`bi-file-earmark-pdf text-lg -ml-[0.3rem]`} />
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
        {format !== undefined && link.id && delayPassed ? (
          <RenderFormat
            link={link}
            format={format}
            isExpanded={isExpanded}
            setMonolithLoaded={setMonolithLoaded}
            setPdfLoaded={setPdfLoaded}
            setImageLoaded={setImageLoaded}
            monolithLoaded={monolithLoaded}
            pdfLoaded={pdfLoaded}
            imageLoaded={imageLoaded}
            standalone={standalone}
            containerRef={containerRef}
            setIsExpanded={setIsExpanded}
          />
        ) : (
          <PreservationSkeleton />
        )}
      </div>
    </div>
  );
}

const RenderFormat = ({
  link,
  format,
  isExpanded,
  setMonolithLoaded,
  setPdfLoaded,
  setImageLoaded,
  monolithLoaded,
  pdfLoaded,
  imageLoaded,
  standalone,
  containerRef,
  setIsExpanded,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  format: ArchivedFormat;
  isExpanded: boolean;
  setMonolithLoaded: (loaded: boolean) => void;
  setPdfLoaded: (loaded: boolean) => void;
  setImageLoaded: (loaded: boolean) => void;
  monolithLoaded: boolean;
  pdfLoaded: boolean;
  imageLoaded: boolean;
  standalone?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  setIsExpanded: (expanded: boolean) => void;
}) => {
  if (!link?.id) return <></>;

  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const [delayPassed, setDelayPassed] = useState(false); // to get the content in place before animating

  useEffect(() => {
    const delay = setTimeout(() => {
      setDelayPassed(true);
    }, 50);

    return () => {
      clearTimeout(delay);
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      const measure = () => {
        if (containerRef.current) {
          setContainerRect(containerRef.current.getBoundingClientRect());
        }
      };

      measure();
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      };
    }
  }, [containerRef, isExpanded]);

  const topPadding = remToPixels(3.75);

  const shouldReduceMotion = useReducedMotion();

  const style = isExpanded
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        transitionProperty:
          delayPassed && !shouldReduceMotion
            ? "width, height, top, left"
            : "none",
      }
    : {
        zIndex: 40,
        position: "absolute" as const,
        top: (containerRect?.top ?? 0) + window.scrollY + topPadding,
        left: (containerRect?.left ?? 0) + window.scrollX,
        width: containerRect?.width ?? 0,
        height: containerRect?.height ? containerRect.height - topPadding : 0,
        transitionProperty:
          delayPassed && !shouldReduceMotion
            ? "width, height, top, left"
            : "none",
      };

  const content = () => {
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
            {!monolithLoaded && <PreservationSkeleton />}
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
            {!pdfLoaded && <PreservationSkeleton />}
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
            {!imageLoaded && <PreservationSkeleton />}
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
        return <></>;
    }
  };

  return ReactDOM.createPortal(
    <div
      style={style}
      className={clsx(
        "z-[40] overflow-hidden ease-in-out duration-100 pointer-events-auto",
        !isExpanded && "rounded-bl-2xl"
      )}
      data-ignore-click-away
    >
      {content()}
      {isExpanded && (
        <div
          className="absolute top-3 right-3 btn btn-circle btn-primary btn-sm"
          onClick={() => setIsExpanded(false)}
        >
          <i className="bi-arrows-angle-contract text-lg" />
        </div>
      )}
    </div>,
    document.body
  );
};
