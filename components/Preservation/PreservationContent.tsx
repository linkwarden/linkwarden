import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { BeatLoader } from "react-spinners";
import Tab from "../Tab";
import ReadableView from "@/components/Preservation/ReadableView";
import { PreservationSkeleton } from "../Skeletons";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@/types/global";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@/lib/shared/formatStats";

type Props = {
  link?: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat;
};

function findAvailableImageFormat(
  link: LinkIncludingShortenedCollectionAndTags
) {
  return formatAvailable(link, "image")
    ? link?.image?.endsWith(".png")
      ? ArchivedFormat.png
      : link?.image?.endsWith(".jpeg") || link?.image?.endsWith(".jpg")
        ? ArchivedFormat.jpeg
        : null
    : null;
}

export const PreservationContent: React.FC<Props> = ({ link, format }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const prevFormatRef = useRef<ArchivedFormat | undefined>();

  const [currentFormat, setCurrentFormat] = useState<ArchivedFormat>(
    format ?? ArchivedFormat.readability
  );

  const screenshotFormat = findAvailableImageFormat(link!);

  const potentialTabs = [
    {
      type: "readable" as const,
      format: ArchivedFormat.readability,
      icon: "bi-file-earmark-text",
      name: "Readable",
    },
    {
      type: "image" as const,
      format: screenshotFormat,
      icon: "bi-file-earmark-image",
      name: "Screenshot",
    },
    {
      type: "monolith" as const,
      format: ArchivedFormat.monolith,
      icon: "bi-filetype-html",
      name: "Webpage",
    },
    {
      type: "pdf" as const,
      format: ArchivedFormat.pdf,
      icon: "bi-file-earmark-pdf",
      name: "PDF",
    },
  ].filter((tab) => {
    if (tab.format == null) return false;
    return formatAvailable(link!, tab.type);
  });

  const activeTabIndex = potentialTabs.findIndex(
    (tab) => tab.format === currentFormat
  );
  const validActiveTabIndex = activeTabIndex >= 0 ? activeTabIndex : 0;

  function handleTabChange(newIndex: number) {
    if (newIndex >= potentialTabs.length) return;
    const newFormat = potentialTabs[newIndex].format!;

    setCurrentFormat(newFormat);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, format: newFormat },
      },
      undefined,
      { shallow: true }
    );
  }

  useEffect(() => {
    if (!router.isReady) return;

    const queryVal = router.query.format;
    if (queryVal) {
      const qFormat = parseInt(queryVal as string, 10);
      const allFormats = [
        ArchivedFormat.readability,
        ArchivedFormat.monolith,
        ArchivedFormat.jpeg,
        ArchivedFormat.png,
        ArchivedFormat.pdf,
      ];

      if (allFormats.includes(qFormat)) {
        setCurrentFormat(qFormat);
        return;
      }
    }

    if (format !== undefined) {
      setCurrentFormat(format);
    } else if (potentialTabs.length > 0) {
      setCurrentFormat(potentialTabs[0].format!);
    }
  }, [router.query.format, router.isReady, format, potentialTabs]);

  useEffect(() => {
    if (prevFormatRef.current !== currentFormat) {
      setPdfLoaded(false);
      setMonolithLoaded(false);
      setImageLoaded(false);
      prevFormatRef.current = currentFormat;
    }
  }, [currentFormat]);

  if (!link?.id) return null;

  const renderFormat = () => {
    switch (currentFormat) {
      case ArchivedFormat.readability:
        return (
          <div className="overflow-auto w-full h-full">
            <ReadableView link={link} />
          </div>
        );

      case ArchivedFormat.monolith:
        return (
          <>
            {!monolithLoaded && (
              <PreservationSkeleton className="max-w-screen-lg" />
            )}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}&_=${link.updatedAt}`}
              className={clsx(
                "w-full border-none h-screen",
                monolithLoaded ? "block" : "hidden"
              )}
              onLoad={() => setMonolithLoaded(true)}
            />
          </>
        );

      case ArchivedFormat.pdf:
        return (
          <>
            {!pdfLoaded && <PreservationSkeleton className="max-w-screen-lg" />}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.pdf}&_=${link.updatedAt}`}
              className={clsx(
                "w-full border-none h-screen",
                pdfLoaded ? "block" : "hidden"
              )}
              onLoad={() => setPdfLoaded(true)}
            />
          </>
        );

      case ArchivedFormat.png:
      case ArchivedFormat.jpeg:
        return (
          <>
            {!imageLoaded && (
              <PreservationSkeleton className="max-w-screen-lg" />
            )}
            <div className={`h-screen overflow-auto flex items-start`}>
              <img
                alt=""
                src={`/api/v1/archives/${link.id}?format=${currentFormat}`}
                className={clsx("w-fit mx-auto", !imageLoaded && "hidden")}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImageLoaded(true);
                  setTimeout(() => {
                    if (img.naturalHeight < window.innerHeight) {
                      img.parentElement?.classList.replace(
                        "items-start",
                        "items-center"
                      );
                    }
                  }, 0);
                }}
                loading="eager"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative bg-base-200 h-screen">
      {link.url && potentialTabs.length > 1 && (
        <Tab
          tabs={potentialTabs.map((tab) => ({
            icon: tab.icon,
            name: tab.name,
          }))}
          activeTabIndex={validActiveTabIndex}
          setActiveTabIndex={handleTabChange}
          className="w-fit absolute left-1/2 -translate-x-1/2 rounded-full bg-base-100 top-2 text-sm shadow-md"
          hideName
        />
      )}
      {!atLeastOneFormatAvailable(link) ? (
        <div className={`w-full h-full flex flex-col justify-center p-10`}>
          <BeatLoader
            color="oklch(var(--p))"
            className="mx-auto mb-3"
            size={30}
          />
          <p className="text-center text-2xl">{t("preservation_in_queue")}</p>
          <p className="text-center text-lg">{t("check_back_later")}</p>
        </div>
      ) : (
        renderFormat()
      )}
    </div>
  );
};
