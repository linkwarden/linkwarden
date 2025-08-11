import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
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

  const isPublic = router.pathname.startsWith("/public") ? true : undefined;

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
        <i className={`${icon} text-xl text-primary`} />
        <p>{name}</p>
      </div>

      <div className="flex gap-1">
        {downloadable || false ? (
          <Button variant="ghost" size="icon" onClick={handleDownload}>
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
