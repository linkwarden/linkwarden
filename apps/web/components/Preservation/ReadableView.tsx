import React, { useEffect, useRef, useState } from "react";
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
} from "@linkwarden/types";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import {
  useGetLinkHighlights,
  usePostHighlight,
  useRemoveHighlight,
} from "@linkwarden/router/highlights";
import { Highlight } from "@linkwarden/prisma/client";
import { useUser } from "@linkwarden/router/user";
import { Caveat } from "next/font/google";
import { Bentham } from "next/font/google";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

const caveat = Caveat({ subsets: ["latin"] });
const bentham = Bentham({ subsets: ["latin"], weight: "400" });

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

  const [isCommenting, setIsCommenting] = useState(false);

  const [selectionInfo, setSelectionInfo] = useState<{
    highlightId?: number | null;
    linkId: number;
    text: string;
    startOffset: number;
    endOffset: number;
    color: "yellow" | "red" | "blue" | "green";
    comment?: string;
  } | null>(null);
  const [linkContent, setLinkContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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

  const { data: user } = useUser();

  useEffect(() => {
    if (!user) return;
    const readerViews = document.getElementsByClassName("reader-view");

    const getFont = () => {
      if (user.readableFontFamily === "caveat") {
        return caveat.style.fontFamily;
      } else if (user.readableFontFamily === "bentham") {
        return bentham.style.fontFamily;
      } else return user.readableFontFamily;
    };

    for (const view of Array.from(readerViews)) {
      const paragraphs = view.getElementsByTagName("p");
      for (const paragraph of Array.from(paragraphs)) {
        paragraph.style.fontSize = user.readableFontSize || "18px";
        paragraph.style.lineHeight = user.readableLineHeight || "1.8";
      }

      const paragraphToUserReadableFontSizeRatio =
        parseInt(user.readableFontSize || "18") / 18;

      const headers1 = view.getElementsByTagName("h1");
      for (const header of Array.from(headers1)) {
        header.style.fontSize =
          35 * paragraphToUserReadableFontSizeRatio + "px";
      }
      const headers2 = view.getElementsByTagName("h2");
      for (const header of Array.from(headers2)) {
        header.style.fontSize =
          30 * paragraphToUserReadableFontSizeRatio + "px";
      }
      const headers3 = view.getElementsByTagName("h3");
      for (const header of Array.from(headers3)) {
        header.style.fontSize =
          26 * paragraphToUserReadableFontSizeRatio + "px";
      }
      const headers4 = view.getElementsByTagName("h4");
      for (const header of Array.from(headers4)) {
        header.style.fontSize =
          21 * paragraphToUserReadableFontSizeRatio + "px";
      }
      const headers5 = view.getElementsByTagName("h5");
      for (const header of Array.from(headers5)) {
        header.style.fontSize =
          18 * paragraphToUserReadableFontSizeRatio + "px";
      }

      (view as HTMLElement).style.fontFamily = `${getFont()}`;
    }
  }, [
    user?.theme,
    user?.readableFontFamily,
    user?.readableFontSize,
    user?.readableLineHeight,
    linkContent,
  ]);

  useEffect(() => {
    if (selectionInfo?.highlightId) {
      const comment = linkHighlights?.find(
        (h) => h.id === selectionInfo.highlightId
      )?.comment;

      if (selectionInfo) {
        setSelectionInfo({ ...selectionInfo, comment: comment || "" });
      }
    }
  }, [selectionInfo?.highlightId, linkHighlights, isCommenting]);

  const handleMouseUp = (e: React.MouseEvent) => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const containerRect = containerEl.getBoundingClientRect();
    const target = e.target as HTMLElement;
    const highlightId = Number(target.dataset.highlightId);
    const selection = window.getSelection();

    const color = linkHighlights?.find((e) => e.id == highlightId)?.color;

    const info = getHighlightedSection();

    if (!menuOpen)
      setSelectionInfo({
        highlightId: highlightId || null,
        linkId: link.id as number,
        text: info?.text || "",
        startOffset: info?.startOffset || -1,
        endOffset: info?.endOffset || -1,
        color: color as any,
      });

    if (highlightId) {
      const rect = target.getBoundingClientRect();
      const relativeX = rect.left - containerRect.left + rect.width / 2;
      const relativeY = rect.top - containerRect.top - 5;

      setMenuOpen(true);
      setMenuPosition({
        x: relativeX,
        y: relativeY,
      });

      return;
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect && rect.width && rect.height) {
        const relativeX = rect.left - containerRect.left + rect.width / 2;
        const relativeY = rect.top - containerRect.top - 5;

        setMenuPosition({
          x: relativeX,
          y: relativeY,
        });
        setMenuOpen(true);
      }
    }
  };

  function getHighlightedSection() {
    const selection = window.getSelection?.();

    if (!selection || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    if (!range) return null;

    const container = document.getElementById("readable-view");
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return null;
    }

    let startOffset = -1;
    let endOffset = -1;
    let currentOffset = 0;

    const treeWalker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );
    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode;
      const nodeLength = node.textContent?.length ?? 0;

      if (node === range.startContainer) {
        startOffset = currentOffset + range.startOffset;
      }

      if (node === range.endContainer) {
        endOffset = currentOffset + range.endOffset;
        break;
      }

      currentOffset += nodeLength;
    }

    if (startOffset === -1 || endOffset === -1) {
      return null;
    }

    return {
      linkId: link.id as number,
      text: range.toString(),
      startOffset,
      endOffset,
    };
  }

  function getHighlightedHtml(
    htmlContent: string,
    highlights: Highlight[]
  ): string {
    if (!htmlContent || !highlights || highlights.length === 0) {
      return htmlContent;
    }

    const container = document.createElement("div");
    container.innerHTML = htmlContent;

    const sortedHighlights = [...highlights].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    for (const highlight of sortedHighlights) {
      applyHighlight(container, highlight);
    }

    return container.innerHTML;
  }

  function applyHighlight(container: HTMLElement, highlight: Highlight) {
    let currentOffset = 0;
    const treeWalker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );

    const rangesToWrap: Array<{
      node: Text;
      start: number;
      end: number;
    }> = [];

    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode as Text;
      const nodeLength = node.textContent?.length ?? 0;
      const nodeStart = currentOffset;
      const nodeEnd = nodeStart + nodeLength;

      if (nodeStart < highlight.endOffset && nodeEnd > highlight.startOffset) {
        rangesToWrap.push({
          node,
          start: Math.max(0, highlight.startOffset - nodeStart),
          end: Math.min(nodeLength, highlight.endOffset - nodeStart),
        });
      }

      currentOffset += nodeLength;
    }

    rangesToWrap.forEach(({ node, start, end }) => {
      if (start > 0) {
        node.splitText(start);
        node = node.nextSibling as Text;
        end -= start;
      }

      if (end < node.length) {
        node.splitText(end);
      }

      const highlightWrapper = document.createElement("span");

      highlightWrapper.id = `highlight-${highlight.id}`;

      highlightWrapper.dataset.highlightId = highlight.id.toString();

      highlightWrapper.classList.add(
        "cursor-pointer",
        "bg-opacity-60",
        "hover:bg-opacity-80",
        "duration-150"
      );

      if (highlight.comment) highlightWrapper.classList.add("border-b-2");

      if (highlight.color === "yellow") {
        highlightWrapper.classList.add("bg-yellow-500", "border-yellow-500");
      } else if (highlight.color === "red") {
        highlightWrapper.classList.add("bg-red-500", "border-red-500");
      } else if (highlight.color === "blue") {
        highlightWrapper.classList.add("bg-blue-500", "border-blue-500");
      } else if (highlight.color === "green") {
        highlightWrapper.classList.add("bg-green-500", "border-green-500");
      }

      node.parentNode?.insertBefore(highlightWrapper, node);
      highlightWrapper.appendChild(node);
    });
  }

  const highlightedHtml = React.useMemo(() => {
    return getHighlightedHtml(linkContent, linkHighlights || []);
  }, [linkContent, linkHighlights]);

  const handleHighlightSelection = async (
    highlightId?: number | null,
    color?: "yellow" | "red" | "blue" | "green"
  ) => {
    console.log(selectionInfo);

    if (
      !highlightId &&
      (!selectionInfo?.text ||
        selectionInfo.startOffset === -1 ||
        selectionInfo.endOffset === -1)
    )
      return;

    if (selectionInfo)
      setSelectionInfo({
        ...selectionInfo,
        color: color as "yellow" | "red" | "blue" | "green",
      });

    let selection = selectionInfo;

    if (highlightId) {
      selection = (linkHighlights?.find(
        (h) => h.id === selectionInfo?.highlightId
      ) ?? null) as any;
    }

    if (!selection && !highlightId) return;

    postHighlight.mutate(
      {
        ...selection,
        color: color || selectionInfo?.color || "yellow",
        comment: selectionInfo?.comment,
      } as Highlight,
      {
        onSuccess: (data) => {
          if (data) {
            setMenuOpen(true);
            if (selectionInfo) {
              setSelectionInfo({
                ...selectionInfo,
                highlightId: data.id,
                linkId: selectionInfo.linkId,
                text: selectionInfo.text,
                startOffset: selectionInfo.startOffset,
                endOffset: selectionInfo.endOffset,
                color: data.color as any,
                comment: selectionInfo.comment,
              });
            }
          }
        },
      }
    );
  };

  const handleMenuClickOutside = () => {
    setMenuOpen(false);
    setSelectionInfo(null);

    setIsCommenting(false);
    if (selectionInfo)
      setSelectionInfo({
        ...selectionInfo,
        comment: "",
      });

    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "flex flex-col gap-3 items-start p-3 mx-auto bg-base-200 mt-5 relative",
        user?.readableLineWidth === "narrower"
          ? "max-w-screen-sm"
          : user?.readableLineWidth === "narrow"
            ? "max-w-screen-md"
            : user?.readableLineWidth === "normal"
              ? "max-w-screen-lg"
              : user?.readableLineWidth === "wide"
                ? "max-w-screen-xl"
                : user?.readableLineWidth === "wider"
                  ? "max-w-screen-2xl"
                  : ""
      )}
    >
      <div className="reader-view">
        <h1>
          {unescapeString(link?.name || link?.description || link?.url || "")}
        </h1>
      </div>

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

      <div className="text-sm text-neutral flex justify-between w-full gap-2">
        <LinkDate link={link} />
      </div>

      <Separator className="mt-5 mb-2" />

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

              {menuOpen &&
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
                    {isCommenting ? (
                      <div>
                        <textarea
                          value={selectionInfo?.comment}
                          onChange={(e) => {
                            if (selectionInfo)
                              setSelectionInfo({
                                ...selectionInfo,
                                comment: e.target.value,
                              });
                          }}
                          placeholder={t("link_description_placeholder")}
                          className="resize-none w-52 rounded-md p-2 h-32 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsCommenting(false);
                              if (selectionInfo)
                                setSelectionInfo({
                                  ...selectionInfo,
                                  comment: "",
                                });
                            }}
                          >
                            {t("cancel")}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              handleHighlightSelection(
                                selectionInfo?.highlightId
                              );
                              setIsCommenting(false);
                              if (selectionInfo)
                                setSelectionInfo({
                                  ...selectionInfo,
                                  comment: "",
                                });
                            }}
                          >
                            {t("save")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 justify-between select-none">
                        {["yellow", "red", "blue", "green"].map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              handleHighlightSelection(
                                selectionInfo?.highlightId,
                                color as "yellow" | "red" | "blue" | "green"
                              )
                            }
                            className={`w-5 h-5 rounded-full ${
                              color === "yellow"
                                ? "bg-yellow-300"
                                : color === "red"
                                  ? "bg-red-500"
                                  : color === "blue"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                            } hover:opacity-70 duration-100 relative`}
                            title={`${
                              color.charAt(0).toUpperCase() + color.slice(1)
                            } Highlight`}
                          >
                            {selectionInfo?.highlightId &&
                              linkHighlights?.find(
                                (h) => h.id === selectionInfo.highlightId
                              )?.color === color && (
                                <i className="bi-check2 text-sm text-black absolute inset-0 flex items-center justify-center" />
                              )}
                          </button>
                        ))}

                        <button
                          className="hover:opacity-70 duration-100"
                          onClick={() => setIsCommenting(true)}
                        >
                          <i className="bi-chat-text" />
                        </button>

                        {selectionInfo?.highlightId && (
                          <button
                            onClick={() => {
                              deleteHighlight.mutate(
                                selectionInfo.highlightId as number
                              );
                              setSelectionInfo(null);
                            }}
                            className="hover:opacity-70 duration-100"
                            title="Delete"
                          >
                            <i className="bi-trash" />
                          </button>
                        )}
                      </div>
                    )}
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
          <p className="text-center text-xl">
            {t("link_preservation_in_queue")}
          </p>
          <p className="text-center text-lg mt-2">{t("check_back_later")}</p>
        </div>
      )}
    </div>
  );
}
