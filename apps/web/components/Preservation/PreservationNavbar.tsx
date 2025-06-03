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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import LinkActions from "../LinkViews/LinkComponents/LinkActions";
import { useCollections } from "@linkwarden/router/collections";
import clsx from "clsx";
import ToggleDarkMode from "../ToggleDarkMode";
import { FitWidth, FormatLineSpacing, FormatSize } from "../ui/icons";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";
import { Caveat } from "next/font/google";
import { Bentham } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"] });
const bentham = Bentham({ subsets: ["latin"], weight: "400" });

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat;
  className?: string;
};

const fontSizes = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "30px",
  "32px",
  "34px",
  "36px",
  "38px",
  "40px",
  "42px",
  "44px",
  "46px",
  "48px",
  "50px",
];

const lineHeights = [
  "1",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.7",
  "1.8",
  "1.9",
  "2",
  "2.1",
  "2.2",
  "2.3",
  "2.4",
  "2.5",
  "2.6",
  "2.7",
  "2.8",
  "2.9",
  "3",
];

const lineWidth = ["narrower", "narrow", "normal", "wide", "wider", "full"];

const PreservationNavbar = ({ link, format, className }: Props) => {
  const { data: collections = [] } = useCollections();
  const { data } = useUser();
  const updateUserPreference = useUpdateUserPreference();

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
    <div
      className={clsx(
        "p-2 z-10 bg-base-100 flex gap-2 justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard`}>
            <i className="bi-chevron-left text-lg text-neutral" />
          </Link>
        </Button>
        {format === ArchivedFormat.readability ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <i className="bi-type text-xl text-neutral" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center gap-2 justify-between w-full">
                    <div className="flex items-center gap-2">
                      <i className="bi-fonts text-lg leading-none text-neutral" />
                      {t("font_family")}
                    </div>
                    <p
                      className="text-neutral capitalize"
                      style={{
                        fontFamily:
                          (data?.readableFontFamily === "caveat"
                            ? caveat.style.fontFamily
                            : data?.readableFontFamily === "bentham"
                              ? bentham.style.fontFamily
                              : data?.readableFontFamily) || "sans-serif",
                      }}
                    >
                      {data?.readableFontFamily?.replace("-", " ")}
                    </p>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: "sans-serif" }}
                    checked={
                      !data?.readableFontFamily ||
                      data?.readableFontFamily === "sans-serif"
                    }
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "sans-serif",
                      });
                    }}
                  >
                    Sans Serif
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: "serif" }}
                    checked={data?.readableFontFamily === "serif"}
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "serif",
                      });
                    }}
                  >
                    Serif
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: "monospace" }}
                    checked={data?.readableFontFamily === "monospace"}
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "monospace",
                      });
                    }}
                  >
                    Monospace
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: "cursive" }}
                    checked={data?.readableFontFamily === "cursive"}
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "cursive",
                      });
                    }}
                  >
                    Cursive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: caveat.style.fontFamily }}
                    checked={data?.readableFontFamily === "caveat"}
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "caveat",
                      });
                    }}
                  >
                    <span className={caveat.className}>Caveat</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    style={{ fontFamily: bentham.style.fontFamily }}
                    checked={data?.readableFontFamily === "bentham"}
                    onSelect={() => {
                      updateUserPreference.mutate({
                        readableFontFamily: "bentham",
                      });
                    }}
                  >
                    <span className={bentham.className}>Bentham</span>
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuLabel className="flex items-center justify-between font-normal gap-2 pr-0">
                <div className="flex items-center gap-2">
                  <FormatSize className="text-lg" />
                  {t("font_size")}
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-neutral">
                    {data?.readableFontSize || "24px"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = fontSizes.indexOf(
                        data?.readableFontSize || "24px"
                      );
                      if (currentIndex > 0) {
                        updateUserPreference.mutate({
                          readableFontSize: fontSizes[currentIndex - 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-dash text-lg" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = fontSizes.indexOf(
                        data?.readableFontSize || "24px"
                      );
                      if (currentIndex < fontSizes.length - 1) {
                        updateUserPreference.mutate({
                          readableFontSize: fontSizes[currentIndex + 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-plus text-lg" />
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuLabel className="flex items-center justify-between font-normal gap-2 pr-0">
                <div className="flex items-center gap-2">
                  <FormatLineSpacing className="text-lg" />
                  {t("line_height")}
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-neutral">
                    {data?.readableLineHeight || "1.8"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = lineHeights.indexOf(
                        data?.readableLineHeight || "1.8"
                      );
                      if (currentIndex > 0) {
                        updateUserPreference.mutate({
                          readableLineHeight: lineHeights[currentIndex - 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-dash text-lg" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = lineHeights.indexOf(
                        data?.readableLineHeight || "1.8"
                      );
                      if (currentIndex < lineHeights.length - 1) {
                        updateUserPreference.mutate({
                          readableLineHeight: lineHeights[currentIndex + 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-plus text-lg" />
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuLabel className="flex items-center justify-between font-normal gap-2 pr-0">
                <div className="flex items-center gap-2">
                  <FitWidth className="text-lg" />
                  {t("line_width")}
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-neutral capitalize">
                    {data?.readableLineWidth || "normal"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = lineWidth.indexOf(
                        data?.readableLineWidth || "normal"
                      );
                      if (currentIndex > 0) {
                        updateUserPreference.mutate({
                          readableLineWidth: lineWidth[currentIndex - 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-dash text-lg" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentIndex = lineWidth.indexOf(
                        data?.readableLineWidth || "normal"
                      );
                      if (currentIndex < lineWidth.length - 1) {
                        updateUserPreference.mutate({
                          readableLineWidth: lineWidth[currentIndex + 1],
                        });
                      }
                    }}
                  >
                    <i className="bi-plus text-lg" />
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() =>
                  updateUserPreference.mutate({
                    readableFontFamily: "sans-serif",
                    readableFontSize: "18px",
                    readableLineHeight: "1.8",
                    readableLineWidth: "normal",
                  })
                }
                className="w-fit mx-auto"
              >
                <i className="bi-arrow-counterclockwise text-neutral" />
                <p className="text-center">{t("reset_defaults")}</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <i className="bi-cloud-arrow-down text-xl text-neutral" />
          </Button>
        )}
      </div>
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

      <div className="flex gap-2 items-center text-neutral">
        <ToggleDarkMode />
        <LinkActions
          link={link}
          collection={collection}
          linkModal={linkModal}
          setLinkModal={(e) => setLinkModal(e)}
          ghost
        />
      </div>
    </div>
  );
};

export default PreservationNavbar;
