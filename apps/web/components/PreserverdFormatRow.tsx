import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Props = {
  name: string;
  icon: string;
  format: ArchivedFormat;
  link: LinkIncludingShortenedCollectionAndTags;
  downloadable?: boolean;
  replaceable?: boolean;
};

export default function PreservedFormatRow({
  name,
  icon,
  format,
  link,
  downloadable,
  replaceable,
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

        {!isPublic && replaceable ? (
          <Button asChild variant="ghost" size="icon">
            <label className="cursor-pointer">
              <i className="bi-cloud-arrow-up text-xl text-neutral" />
              <input
                type="file"
                accept={
                  format === ArchivedFormat.monolith
                    ? "text/html,.html"
                    : format === ArchivedFormat.pdf
                    ? "application/pdf,.pdf"
                    : format === ArchivedFormat.png || format === ArchivedFormat.jpeg
                    ? "image/png,image/jpeg,.png,.jpg,.jpeg"
                    : undefined
                }
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formBody = new FormData();
                  formBody.append("file", file);

                  const res = await fetch(
                    `/api/v1/archives/${link?.id}?format=${format}`,
                    {
                      method: "POST",
                      body: formBody,
                    }
                  );

                  if (res.ok) {
                    toast.success("Replaced file");
                    // refresh page data
                    router.replace(router.asPath);
                  } else {
                    const data = await res.json().catch(() => ({}));
                    toast.error(data?.response || "Failed to replace file");
                  }
                }}
              />
            </label>
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
