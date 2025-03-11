import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { PreservationSkeleton } from "../Skeletons";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import isValidUrl from "@/lib/shared/isValidUrl";
import LinkDate from "../LinkViews/LinkComponents/LinkDate";
import usePermissions from "@/hooks/usePermissions";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@/types/global";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import {
  useGetLinkHighlights,
  usePostHighlight,
  useRemoveHighlight,
} from "@/hooks/store/highlights";
import { Highlight } from "@prisma/client";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function ReadableView({ link }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");
  const permissions = usePermissions(link?.collection?.id as number);

  const postHighlight = usePostHighlight(link?.id as number);
  const { data: linkHighlights } = useGetLinkHighlights(link?.id as number);
  const deleteHighlight = useRemoveHighlight(link?.id as number);

  const [linkContent, setLinkContent] = useState("");
  const [selectionMenu, setSelectionMenu] = useState<{
    show: boolean;
    highlightId: number | null;
  }>({
    show: false,
    highlightId: null,
  });
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function fetchLinkContent() {
      if (link?.readable?.startsWith("archives")) {
        const response = await fetch(
          `/api/v1/archives/${link?.id}?format=${ArchivedFormat.readability}&_=${link.updatedAt}`
        );
        const data = await response.json();

        setLinkContent(data?.content ?? "");
      }
    }
    fetchLinkContent();
  }, [link]);

  const handleMouseUp = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const highlightId = Number(target.dataset.highlightId);
    const selection = window.getSelection();

    if (highlightId) {
      const rect = target.getBoundingClientRect();
      setSelectionMenu({
        show: true,
        highlightId: highlightId,
      });

      setMenuPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 5,
      });

      return;
    } else if (
      selection &&
      selection.rangeCount > 0 &&
      !selection.isCollapsed
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect && rect.width && rect.height) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft =
          window.scrollX || document.documentElement.scrollLeft;

        setMenuPosition({
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.top + scrollTop - 5,
        });
        setSelectionMenu({
          show: true,
          highlightId: selectionMenu.highlightId,
        });
      }
    }
  };

  const getHighlightedSection = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    try {
      const range = selection.getRangeAt(0).cloneRange();

      const selectedText = selection.toString();

      if (!selectedText) {
        setSelectionMenu({
          show: false,
          highlightId: null,
        });

        return null;
      }

      const containerText = range.commonAncestorContainer.textContent;

      if (!containerText) {
        setSelectionMenu({
          show: false,
          highlightId: null,
        });

        return null;
      }

      const relativeIndex = containerText.indexOf(selectedText);

      if (relativeIndex === -1) {
        setSelectionMenu({
          show: false,
          highlightId: null,
        });

        return null;
      }

      const containerOffset = linkContent.indexOf(containerText);

      const startOffset = containerOffset + relativeIndex;

      if (startOffset !== -1 && link?.id) {
        return {
          linkId: link.id,
          color,
          text: selection.toString(),
          startOffset,
          endOffset: startOffset + selectedText.length,
        };
      } else {
        setSelectionMenu({
          show: false,
          highlightId: null,
        });

        return null;
      }
    } catch (err) {
      console.error("Could not highlight selection:", err);
      setSelectionMenu({
        show: false,
        highlightId: null,
      });
    }
  };

  const highlightedHtml = React.useMemo(() => {
    return getHighlightedHtml(linkContent, linkHighlights || []);
  }, [linkContent, linkHighlights]);

  const handleHighlightSelection = async (
    color: "yellow" | "red" | "blue" | "green"
  ) => {
    const selection = getHighlightedSection(color);
    if (!selection) return;

    postHighlight.mutate(selection, {
      onSuccess: (data) => {
        if (data) {
          setSelectionMenu({
            show: true,
            highlightId: data.id,
          });
        }
      },
    });
  };

  const handleMenuClickOutside = () => {
    setSelectionMenu({
      show: false,
      highlightId: null,
    });

    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div className="flex flex-col gap-3 items-start p-3 max-w-screen-lg mx-auto bg-base-200 mt-10">
      <div className="flex gap-3 items-start">
        <div className="flex flex-col w-full gap-1">
          <p className="md:text-4xl text-2xl">
            {unescapeString(link?.name || link?.description || link?.url || "")}
          </p>
          {link?.url && (
            <Link
              href={link?.url || ""}
              title={link?.url}
              target="_blank"
              className="hover:opacity-60 duration-100 break-all text-sm flex items-center gap-1 text-neutral w-fit"
            >
              <i className="bi-link-45deg" />
              {isValidUrl(link?.url || "") && new URL(link?.url as string).host}
            </Link>
          )}
        </div>
      </div>

      <div className="text-sm text-neutral flex justify-between w-full gap-2">
        <LinkDate link={link} />
      </div>

      {link?.readable?.startsWith("archives") ? (
        <>
          {linkContent ? (
            <div
              className={clsx("p-3 rounded-md w-full bg-base-200")}
              onMouseUp={handleMouseUp}
            >
              <div
                id="readable-view"
                className="line-break px-1 reader-view read-only"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />

              {selectionMenu.show &&
                !isPublicRoute &&
                (permissions === true || permissions?.canUpdate) && (
                  <ClickAwayHandler
                    onClickOutside={handleMenuClickOutside}
                    className="absolute bg-base-100 p-2 z-[9999] 
                               whitespace-nowrap -translate-x-1/2 
                               -translate-y-full rounded-lg shadow-md border border-neutral-content"
                    style={{
                      left: menuPosition.x,
                      top: menuPosition.y,
                    }}
                  >
                    <div className="flex items-center gap-3 justify-between select-none">
                      <div className="flex items-center gap-3">
                        {["yellow", "red", "blue", "green"].map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              handleHighlightSelection(
                                color as "yellow" | "red" | "blue" | "green"
                              )
                            }
                            className={`w-5 h-5 rounded-full bg-${color}-500 hover:opacity-70 duration-100 relative`}
                            title={`${
                              color.charAt(0).toUpperCase() + color.slice(1)
                            } Highlight`}
                          >
                            {selectionMenu.highlightId &&
                              linkHighlights?.find(
                                (h) => h.id === selectionMenu.highlightId
                              )?.color === color && (
                                <i className="bi-check text-black absolute inset-0 flex items-center justify-center" />
                              )}
                          </button>
                        ))}
                      </div>

                      {selectionMenu.highlightId && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              deleteHighlight.mutate(
                                selectionMenu.highlightId as number
                              );
                              setSelectionMenu({
                                show: false,
                                highlightId: null,
                              });
                            }}
                            className="hover:opacity-70 duration-100"
                            title="Delete"
                          >
                            <i className="bi-trash" />
                          </button>
                        </div>
                      )}
                    </div>
                  </ClickAwayHandler>
                )}
            </div>
          ) : (
            <PreservationSkeleton className="h-fit" />
          )}
        </>
      ) : (
        <div className={`w-full h-full flex flex-col justify-center`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="w-1/4 min-w-[7rem] max-w-[15rem] h-auto mx-auto mb-5"
            viewBox="0 0 16 16"
          >
            <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.598.598 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.598.598 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.598.598 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535L7.733.063z" />
            <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.598.598 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.659z" />
          </svg>
          <p className="text-center text-2xl">
            {t("link_preservation_in_queue")}
          </p>
          <p className="text-center text-lg mt-2">{t("check_back_later")}</p>
        </div>
      )}
    </div>
  );
}

function getHighlightedHtml(
  htmlContent: string,
  highlights: Highlight[]
): string {
  if (!htmlContent || !highlights?.length) return htmlContent;

  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  let result = "";
  let lastEnd = 0;

  for (const h of sorted) {
    if (h.endOffset <= 0 || h.startOffset >= htmlContent.length) continue;
    const start = Math.max(lastEnd, h.startOffset);
    const end = Math.min(htmlContent.length, h.endOffset);

    if (start > lastEnd) {
      result += htmlContent.substring(lastEnd, start);
    }
    if (end > start) {
      const highlightedSection = htmlContent.substring(start, end);
      let color;
      switch (h.color) {
        case "yellow":
          color = "bg-yellow-300";
          break;
        case "red":
          color = "bg-red-500";
          break;
        case "blue":
          color = "bg-blue-500";
          break;
        case "green":
          color = "bg-green-500";
          break;
        default:
          color = h.color;
      }

      result += `<span class="rounded-md px-1 ${color} hover:bg-opacity-45 bg-opacity-60 duration-100 cursor-pointer" data-highlight-id="${h.id}">${highlightedSection}</span>`;
      lastEnd = end;
    }
  }

  if (lastEnd < htmlContent.length) {
    result += htmlContent.substring(lastEnd);
  }

  return result;
}
