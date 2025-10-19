import { formatAvailable } from "@linkwarden/lib/formatStats";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
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
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
          aria-label={`${t("view")} ${t("webpage")}`}
        >
          <i
            className="bi-filetype-html text-md leading-none"
            aria-hidden="true"
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
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
          aria-label={`${t("view")} ${t("image")}`}
        >
          <i
            className="bi-file-earmark-image text-md leading-none"
            aria-hidden="true"
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
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
          aria-label={`${t("view")} ${t("pdf")}`}
        >
          <i
            className="bi-file-earmark-pdf text-md leading-none"
            aria-hidden="true"
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
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          className="hover:opacity-70 duration-100"
          aria-label={`${t("view")} ${t("readable")}`}
        >
          <i
            className="bi-file-earmark-text text-md leading-none"
            aria-hidden="true"
            title={t("readable")}
          ></i>
        </Link>
      )}
    </div>
  );
}
