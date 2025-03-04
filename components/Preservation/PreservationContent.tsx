import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import ReadableView from "@/components/Preservation/ReadableView";
import { PreservationSkeleton } from "../Skeletons";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { BeatLoader } from "react-spinners";
import { useTranslation } from "next-i18next";
import { atLeastOneFormatAvailable } from "@/lib/shared/formatStats";
import Tab from "../Tab";

type Props = {
  link?: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat; // Optional now, for backward compatibility
};

export const PreservationContent: React.FC<Props> = ({ link, format }) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const prevFormatRef = useRef<ArchivedFormat | undefined>(undefined);
  const { t } = useTranslation();

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  useEffect(() => {
    if (prevFormatRef.current !== format) {
      setPdfLoaded(false);
      setMonolithLoaded(false);
      setImageLoaded(false);

      prevFormatRef.current = format;
    }
  }, [format]);

  if (!link?.id) return <></>;

  const renderFormat = () => {
    switch (format) {
      case ArchivedFormat.readability:
        return (
          <div className="overflow-auto w-full h-full">
            <ReadableView link={link} />
          </div>
        );
      case ArchivedFormat.monolith:
        return (
          <>
            {!monolithLoaded && <PreservationSkeleton />}
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
            {!pdfLoaded && <PreservationSkeleton />}
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
            {!imageLoaded && <PreservationSkeleton />}
            <img
              alt=""
              src={`/api/v1/archives/${link.id}?format=${format}&_=${link.updatedAt}`}
              className={clsx("w-fit mx-auto", !imageLoaded && "hidden")}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        );
      default:
        return <></>;
    }
  };

  return (
    <div className="relative bg-base-200">
      {link.url && (
        <Tab
          tabs={[
            {
              icon: "bi-file-earmark-text",
              name: "Readable",
            },
            {
              icon: "bi-file-earmark-image",
              name: "Screenshot",
            },
            {
              icon: "bi-filetype-html",
              name: "Webpage",
            },
            {
              icon: "bi-file-earmark-pdf",
              name: "PDF",
            },
          ]}
          activeTabIndex={activeTabIndex}
          setActiveTabIndex={setActiveTabIndex}
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
