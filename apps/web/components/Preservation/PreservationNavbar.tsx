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

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat;
};

const PreservationNavbar = ({ link, format }: Props) => {
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

  function handleTabChange(newIndex: number) {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, format: newIndex },
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-5 flex gap-2 justify-between">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard`}>
          <i className="bi-chevron-left text-xl" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8">
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
                format === ArchivedFormat.png || format === ArchivedFormat.jpeg
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
      {/* <LinkActions
        link={link}
        collection={collection}
        linkModal={linkModal}
        setLinkModal={(e) => setLinkModal(e)}
        ghost
      /> */}
    </div>
  );
};

export default PreservationNavbar;
