import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import LinkActions from "../LinkViews/LinkComponents/LinkActions";
import { useCollections } from "@linkwarden/router/collections";
import clsx from "clsx";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat;
  className?: string;
};

const PreservationNavbar = ({ link, format, className }: Props) => {
  const { data: collections = [] } = useCollections();

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );

  const [linkModal, setLinkModal] = useState(false);

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );
  }, [collections]);

  const { t } = useTranslation();
  const router = useRouter();

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
    <div className={clsx("p-2 z-10 bg-base-100", className)}>
      <div className="max-w-6xl flex gap-2 justify-between mx-auto">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard`}>
            <i className="bi-chevron-left text-xl text-neutral" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-8 text-neutral">
              {format === ArchivedFormat.readability
                ? t("readable")
                : format === ArchivedFormat.monolith
                  ? t("webpage")
                  : format === ArchivedFormat.pdf
                    ? t("pdf")
                    : t("screenshot")}
              <i className="bi-chevron-down" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {formatAvailable(link, "readable") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.readability,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.readability}
              >
                {t("readable")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "monolith") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.monolith,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.monolith}
              >
                {t("webpage")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "image") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: link?.image?.endsWith(".png")
                          ? ArchivedFormat.png
                          : ArchivedFormat.jpeg,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={
                  format === ArchivedFormat.png ||
                  format === ArchivedFormat.jpeg
                }
              >
                {t("screenshot")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "pdf") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.pdf,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.pdf}
              >
                {t("pdf")}
              </DropdownMenuCheckboxItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2 items-center text-neutral">
          {format === ArchivedFormat.readability ? (
            <Button
              variant="ghost"
              size="icon"
              className="font-extralight text-lg"
            >
              Aa
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <i className="bi-cloud-arrow-down text-xl" />
            </Button>
          )}
          <LinkActions
            link={link}
            collection={collection}
            linkModal={linkModal}
            setLinkModal={(e) => setLinkModal(e)}
            ghost
          />
        </div>
      </div>
    </div>
  );
};

export default PreservationNavbar;
