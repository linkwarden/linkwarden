import React, { useEffect, useState } from "react";
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

  function getTextNodesIn(root: Node): Text[] {
    const textNodes: Text[] = [];
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        textNodes.push(child as Text);
      } else {
        textNodes.push(...getTextNodesIn(child));
      }
    }
    return textNodes;
  }

  function getNodeName(node: Node): string {
    return node.nodeType === Node.TEXT_NODE
      ? "text()"
      : node.nodeName.toLowerCase();
  }

  function getNodePositionAmongSameType(node: Node): number {
    const nodeName = getNodeName(node);
    let index = 1;
    let prev = node.previousSibling;
    while (prev) {
      if (getNodeName(prev) === nodeName) {
        index++;
      }
      prev = prev.previousSibling;
    }
    return index;
  }

  function getXPathForNode(node: Node, root: Node): string {
    if (node === root) {
      return "";
    }
    const segments: string[] = [];
    let currentNode: Node | null = node;

    while (currentNode && currentNode !== root) {
      const nodeName = getNodeName(currentNode);
      const index = getNodePositionAmongSameType(currentNode);
      segments.push(`${nodeName}[${index}]`);
      currentNode = currentNode.parentNode;
    }

    segments.reverse();
    return "/" + segments.join("/");
  }

  function resolveNodeFromXPath(root: Node, xPath: string): Node | null {
    if (!xPath || xPath === "/") return root;
    let path = xPath;
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    let currentNode: Node | null = root;
    const segments = path.split("/");

    for (const segment of segments) {
      const match = segment.match(/^([^\[]+)\[(\d+)\]$/);
      if (!match) {
        return null;
      }
      const [_, nodeName, indexStr] = match;
      const index = parseInt(indexStr, 10);

      currentNode = findChildByNameAndIndex(currentNode, nodeName, index);
      if (!currentNode) return null;
    }

    return currentNode;
  }

  function findChildByNameAndIndex(
    parent: Node,
    nodeName: string,
    index: number
  ): Node | null {
    let count = 0;
    for (const child of Array.from(parent.childNodes)) {
      if (getNodeName(child) === nodeName) {
        count++;
        if (count === index) return child;
      }
    }
    return null;
  }

  function getHighlightedSection(color: string) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return null;

    const range = selection.getRangeAt(0);

    let startNode = range.startContainer;
    let endNode = range.endContainer;
    let startOffset = range.startOffset;
    let endOffset = range.endOffset;

    if (startNode === endNode && startOffset > endOffset) {
      [startOffset, endOffset] = [endOffset, startOffset];
    } else if (startNode !== endNode) {
      const selectionBackwards = range.collapsed;
      if (selectionBackwards) {
        [startNode, endNode] = [endNode, startNode];
        [startOffset, endOffset] = [endOffset, startOffset];
      } else {
        const position = startNode.compareDocumentPosition(endNode);
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          [startNode, endNode] = [endNode, startNode];
          [startOffset, endOffset] = [endOffset, startOffset];
        }
      }
    }

    const text = selection.toString();
    if (!text.trim()) return null;

    const container = document.getElementById("readable-view");
    if (!container) return null;

    const startXPath = getXPathForNode(startNode, container);
    const endXPath = getXPathForNode(endNode, container);
    if (!startXPath || !endXPath) return null;

    return {
      linkId: link?.id as number,
      color,
      text,
      startXPath,
      startOffset,
      endXPath,
      endOffset,
    };
  }

  function getHighlightedHtml(
    htmlContent: string,
    highlights: Array<{
      id: number;
      color: string;
      text: string;
      startXPath: string;
      startOffset: number;
      endXPath: string;
      endOffset: number;
    }>
  ) {
    if (!htmlContent) return "";
    if (!highlights || !highlights.length) return htmlContent;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const docRoot = doc.body || doc.documentElement;
    const textNodes = getTextNodesIn(docRoot);
    type IndexedHighlight = {
      id: number;
      color: string;
      text: string;
      startXPath: string;
      startOffset: number;
      endXPath: string;
      endOffset: number;
      startNodeIndex: number;
      endNodeIndex: number;
      earliestNodeIndex: number;
      earliestOffset: number;
    };

    const indexed: IndexedHighlight[] = highlights.map((hl) => {
      const startNode = resolveNodeFromXPath(docRoot, hl.startXPath);
      const endNode = resolveNodeFromXPath(docRoot, hl.endXPath);
      let startIndex = startNode ? textNodes.indexOf(startNode as Text) : -1;
      let endIndex = endNode ? textNodes.indexOf(endNode as Text) : -1;

      if (!startNode || startNode.nodeType !== Node.TEXT_NODE) {
        startIndex = -1;
      }
      if (!endNode || endNode.nodeType !== Node.TEXT_NODE) {
        endIndex = -1;
      }

      let sIndex = startIndex;
      let eIndex = endIndex;
      let sOffset = hl.startOffset;
      let eOffset = hl.endOffset;
      if (sIndex > eIndex || (sIndex === eIndex && sOffset > eOffset)) {
        [sIndex, eIndex] = [eIndex, sIndex];
        [sOffset, eOffset] = [eOffset, sOffset];
      }

      const earliestNodeIndex = sIndex;
      const earliestOffset = sOffset;

      return {
        ...hl,
        startNodeIndex: sIndex,
        endNodeIndex: eIndex,
        startOffset: sOffset,
        endOffset: eOffset,
        earliestNodeIndex,
        earliestOffset,
      };
    });

    indexed.sort((a, b) => {
      if (a.earliestNodeIndex !== b.earliestNodeIndex) {
        return b.earliestNodeIndex - a.earliestNodeIndex;
      }
      return b.earliestOffset - a.earliestOffset;
    });

    for (const hl of indexed) {
      applyRangeHighlight(docRoot, textNodes, hl);
    }

    return docRoot.innerHTML;
  }

  function applyRangeHighlight(
    docRoot: HTMLElement,
    textNodes: Text[],
    hl: {
      id: number;
      color: string;
      startNodeIndex: number;
      startOffset: number;
      endNodeIndex: number;
      endOffset: number;
    }
  ) {
    const { startNodeIndex, endNodeIndex } = hl;
    if (startNodeIndex < 0 || endNodeIndex < 0) return;
    if (startNodeIndex >= textNodes.length || endNodeIndex >= textNodes.length)
      return;

    for (let i = startNodeIndex; i <= endNodeIndex; i++) {
      const node = textNodes[i];
      const nodeLength = node.nodeValue?.length ?? 0;
      if (nodeLength === 0) continue;

      let chunkStart = 0;
      let chunkEnd = nodeLength;

      if (i === startNodeIndex) {
        chunkStart = hl.startOffset;
      }
      if (i === endNodeIndex) {
        chunkEnd = hl.endOffset;
      }

      if (chunkStart < 0) chunkStart = 0;
      if (chunkEnd > nodeLength) chunkEnd = nodeLength;
      if (chunkStart >= chunkEnd) continue;

      wrapTextRangeInNode(node, chunkStart, chunkEnd, hl);
    }
  }

  function wrapTextRangeInNode(
    textNode: Text,
    nodeStart: number,
    nodeEnd: number,
    hl: { id: number; color: string }
  ) {
    const range = document.createRange();
    range.setStart(textNode, nodeStart);
    range.setEnd(textNode, nodeEnd);

    const highlightSpan = document.createElement("span");
    highlightSpan.setAttribute("data-highlight-id", hl.id.toString());
    highlightSpan.classList.add("highlighted-span");

    switch (hl.color) {
      case "yellow":
        highlightSpan.classList.add("bg-yellow-500");
        break;
      case "red":
        highlightSpan.classList.add("bg-red-500");
        break;
      case "blue":
        highlightSpan.classList.add("bg-blue-500");
        break;
      case "green":
        highlightSpan.classList.add("bg-green-500");
        break;
      default:
        highlightSpan.classList.add("bg-gray-300");
        break;
    }
    highlightSpan.classList.add("bg-opacity-80", "cursor-pointer");

    range.surroundContents(highlightSpan);
  }

  const highlightedHtml = React.useMemo(() => {
    return getHighlightedHtml(linkContent, linkHighlights || []);
  }, [linkContent, linkHighlights]);

  const handleHighlightSelection = async (
    color: "yellow" | "red" | "blue" | "green",
    highlightId: number | null
  ) => {
    let selection = getHighlightedSection(color);

    if (highlightId) {
      selection =
        linkHighlights?.find((h) => h.id === selectionMenu.highlightId) ?? null;

      if (selection) selection.color = color;
    }

    if (!selection && !highlightId) return;

    postHighlight.mutate(selection as Highlight, {
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
                                color as "yellow" | "red" | "blue" | "green",
                                selectionMenu.highlightId
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
                            {selectionMenu.highlightId &&
                              linkHighlights?.find(
                                (h) => h.id === selectionMenu.highlightId
                              )?.color === color && (
                                <i className="bi-check2 text-sm text-black absolute inset-0 flex items-center justify-center" />
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
