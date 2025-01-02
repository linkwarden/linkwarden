import { formatAvailable } from "@/lib/shared/formatStats";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LinkFormats({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  const { t } = useTranslation();

  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  return (
    <div className="flex gap-1 text-neutral">
      {formatAvailable(link, "monolith") && (
        <Link
          href={`${isPublic ? "/public" : ""}/preserved/${link?.id}?format=${
            ArchivedFormat.monolith
          }`}
          target="_blank"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
        >
          <i
            className="bi-filetype-html text-md leading-none"
            title={t("webpage")}
          ></i>
        </Link>
      )}
      {formatAvailable(link, "image") && (
        <Link
          href={`${isPublic ? "/public" : ""}/preserved/${link?.id}?format=${
            link?.image?.endsWith("png")
              ? ArchivedFormat.png
              : ArchivedFormat.jpeg
          }`}
          target="_blank"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
        >
          <i
            className="bi-file-earmark-image text-md leading-none"
            title={t("image")}
          ></i>
        </Link>
      )}
      {formatAvailable(link, "pdf") && (
        <Link
          href={`${isPublic ? "/public" : ""}/preserved/${link?.id}?format=${
            ArchivedFormat.pdf
          }`}
          target="_blank"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
        >
          <i
            className="bi-file-earmark-pdf text-md leading-none"
            title={t("pdf")}
          ></i>
        </Link>
      )}
      {formatAvailable(link, "readable") && (
        <Link
          href={`${isPublic ? "/public" : ""}/preserved/${link?.id}?format=${
            ArchivedFormat.readability
          }`}
          target="_blank"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
        >
          <i
            className="bi-file-earmark-text text-md leading-none"
            title={t("readable")}
          ></i>
        </Link>
      )}
    </div>
  );
}
