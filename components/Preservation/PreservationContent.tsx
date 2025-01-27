import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import ReadableView from "@/components/Preservation/ReadableView";
import { PreservationSkeleton } from "../Skeletons";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";

type Props = {
  format: ArchivedFormat;
  isExpanded: boolean;
  link?: LinkIncludingShortenedCollectionAndTags;
  standalone?: boolean;
};

export const PreservationContent: React.FC<Props> = ({
  link,
  format,
  isExpanded,
  standalone,
}) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [monolithLoaded, setMonolithLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const prevFormatRef = useRef<ArchivedFormat | undefined>(undefined);

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
            <ReadableView link={link} isExpanded={isExpanded} />
          </div>
        );
      case ArchivedFormat.monolith:
        return (
          <>
            {!monolithLoaded && <PreservationSkeleton />}
            <iframe
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}&_=${link.updatedAt}`}
              className={clsx(
                "w-full border-none",
                monolithLoaded ? "block" : "hidden",
                isExpanded
                  ? "h-full"
                  : standalone
                    ? "h-[calc(100vh-3.75rem)]"
                    : "h-[calc(80vh-3.75rem)]"
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
                "w-full border-none",
                pdfLoaded ? "block" : "hidden",
                isExpanded
                  ? "h-full"
                  : standalone
                    ? "h-[calc(100vh-3.75rem)]"
                    : "h-[calc(80vh-3.75rem)]"
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
            <div className="overflow-auto w-fit mx-auto h-full flex items-center">
              <img
                alt=""
                src={`/api/v1/archives/${link.id}?format=${format}&_=${link.updatedAt}`}
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

  return <>{renderFormat()}</>;
};
