import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/router";

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

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  const handleDownload = () => {
    const path = `/api/v1/archives/${link?.id}?format=${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          // Create a temporary link and click it to trigger the download
          const anchorElement = document.createElement("a");
          anchorElement.href = path;
          anchorElement.download =
            format === ArchivedFormat.monolith
              ? "Webpage"
              : format === ArchivedFormat.pdf
                ? "PDF"
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
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <i className={`${icon} text-2xl text-primary`} />
        <p>{name}</p>
      </div>

      <div className="flex gap-1">
        {downloadable || false ? (
          <div
            onClick={() => handleDownload()}
            className="btn btn-sm btn-square btn-ghost"
          >
            <i className="bi-cloud-arrow-down text-xl text-neutral" />
          </div>
        ) : undefined}

        <Link
          href={`${
            isPublic ? "/public" : ""
          }/preserved/${link?.id}?format=${format}`}
          target="_blank"
          className="btn btn-sm btn-square btn-ghost"
        >
          <i className="bi-box-arrow-up-right text-lg text-neutral" />
        </Link>
      </div>
    </div>
  );
}
