import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { BeatLoader } from "react-spinners";
import ReadableView from "@/components/Preservation/ReadableView";
import { PreservationSkeleton } from "../Skeletons";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@linkwarden/types";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import PreservationNavbar from "./PreservationNavbar";

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

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.format) {
      const query = Number(router.query.format as string);
      const allFormats = [
        ArchivedFormat.readability,
        ArchivedFormat.monolith,
        ArchivedFormat.jpeg,
        ArchivedFormat.png,
        ArchivedFormat.pdf,
      ];

      if (allFormats.includes(query)) {
        setCurrentFormat(query);
        return;
      }
    }

    if (format !== undefined) {
      setCurrentFormat(format);
    }
  }, [router.query.format, router.isReady, format]);

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
              <PreservationSkeleton className="max-w-screen-lg h-[calc(100vh-3.1rem)]" />
            )}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}&_=${link.updatedAt}`}
              className={clsx(
                "w-full border-none h-[calc(100vh-3.1rem)]",
                monolithLoaded ? "block" : "hidden"
              )}
              onLoad={() => setMonolithLoaded(true)}
            />
          </>
        );

      case ArchivedFormat.pdf:
        return (
          <>
            {!pdfLoaded && (
              <PreservationSkeleton className="max-w-screen-lg h-[calc(100vh-3.1rem)]" />
            )}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.pdf}&_=${link.updatedAt}`}
              className={clsx(
                "w-full border-none h-[calc(100vh-3.1rem)]",
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
              <PreservationSkeleton className="max-w-screen-lg h-[calc(100vh-3.1rem)]" />
            )}
            <div
              className={clsx(
                "overflow-auto flex items-start",
                imageLoaded && "h-[calc(100vh-3.1rem)]"
              )}
            >
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
                  }, 1);
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
    <div className="relative bg-base-200">
      {!atLeastOneFormatAvailable(link) ? (
        <div className={`w-full h-full flex flex-col justify-center p-10`}>
          <BeatLoader
            color="oklch(var(--p))"
            className="mx-auto mb-3"
            size={30}
          />
          <p className="text-center text-xl">{t("preservation_in_queue")}</p>
          <p className="text-center text-lg">{t("check_back_later")}</p>
        </div>
      ) : (
        renderFormat()
      )}
    </div>
  );
};
