import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types/global";
import getPreservedFormatUrl from "@linkwarden/lib/getPreservedFormatUrl";
import { useConfig } from "@linkwarden/router/config";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

type Props = {
  name: string;
  icon: string;
  format: ArchivedFormat;
  link: LinkIncludingShortenedCollectionAndTags;
  downloadable?: boolean;
};

export default function PreservedFormatRow({
  name,
  icon,
  format,
  link,
  downloadable,
}: Props) {
  const router = useRouter();
  const { data: config, isLoading: isConfigLoading } = useConfig();

  const isPublic = router.pathname.startsWith("/public") ? true : undefined;
  const isMonolithConfigPending =
    format === ArchivedFormat.monolith && isConfigLoading && !config;

  const handleDownload = async () => {
    if (typeof link.id !== "number" || isMonolithConfigPending) {
      return;
    }

    try {
      const isCrossOriginMonolith =
        format === ArchivedFormat.monolith && config?.USER_CONTENT_DOMAIN;
      const path = isCrossOriginMonolith
        ? await getPreservedFormatUrl({
            tokenEndpoint: "/api/v1/preserved/token",
            linkId: link.id,
            format,
            download: true,
            requestInit: {
              cache: "no-store",
            },
          })
        : `/api/v1/archives/${link?.id}?format=${format}`;

      if (!isCrossOriginMonolith) {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error("Failed to download file");
        }
      }

      const anchorElement = document.createElement("a");
      anchorElement.href = path;
      anchorElement.download =
        format === ArchivedFormat.monolith
          ? "Webpage"
          : format === ArchivedFormat.pdf
            ? "PDF"
            : "Screenshot";
      anchorElement.click();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <i className={`${icon} text-xl text-primary`} />
        <p>{name}</p>
      </div>

      <div className="flex gap-1">
        {downloadable || false ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isMonolithConfigPending}
          >
            <i className="bi-cloud-arrow-down text-xl text-neutral" />
          </Button>
        ) : undefined}

        <Button asChild variant="ghost" size="icon">
          <Link
            href={`${
              isPublic ? "/public" : ""
            }/preserved/${link?.id}?format=${format}`}
            target="_blank"
          >
            <i className="bi-box-arrow-up-right text-lg text-neutral" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
