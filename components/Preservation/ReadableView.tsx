// Uncomment the comments for a basic notetaking functionality... (WIP)
import React, { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
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
} from "@/hooks/store/highlights";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function ReadableView({ link }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public");
  const permissions = usePermissions(link?.collection?.id as number);

  const postHighlight = usePostHighlight();
  const { data: linkHighlights } = useGetLinkHighlights(link?.id as number);

  const [linkContent, setLinkContent] = useState("");
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  // const [isCommenting, setIsCommenting] = useState(false);
  // const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const fetchLinkContent = async () => {
      if (link?.readable?.startsWith("archives")) {
        const response = await fetch(
          `/api/v1/archives/${link?.id}?format=${ArchivedFormat.readability}&_=${link.updatedAt}`
        );
        const data = await response.json();
        setLinkContent(DOMPurify.sanitize(data?.content) || "");
      }
    };
    fetchLinkContent();
  }, [link]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection) return;

    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect && rect.width && rect.height) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      setMenuPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 5,
      });
      setShowSelectionMenu(true);
    }
  };

  const getHighlightedSection = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    try {
      const content = document.getElementById("readable-view")?.innerText;
      const sel = window.getSelection();
      const range = sel?.getRangeAt(0).cloneRange();
      const markerTextChar = range?.cloneContents();

      const selectedIndex = content?.indexOf(markerTextChar?.textContent || "");

      if (
        selectedIndex !== undefined &&
        markerTextChar?.textContent?.length !== undefined &&
        selectedIndex !== -1 &&
        markerTextChar?.textContent?.length !== -1 &&
        link?.id
      ) {
        return {
          linkId: link.id,
          color,
          text: markerTextChar?.textContent,
          startOffset: selectedIndex,
          endOffset: selectedIndex + markerTextChar.textContent.length,
        };
      }
      return null;
    } catch (err) {
      console.error("Could not highlight selection:", err);
    }
  };

  const handleHighlightSelection = async (
    color: "yellow" | "red" | "blue" | "green"
  ) => {
    const selection = getHighlightedSection(color);
    if (!selection) return;

    postHighlight.mutate(selection);
  };

  // const handleStartCommenting = (
  //   event: React.MouseEvent<HTMLButtonElement>
  // ) => {
  //   event.preventDefault();
  //   const highlighted = getHighlightedSection("yellow");
  //   if (!highlighted) return;

  //   setIsCommenting(true);
  // };

  // const handleConfirmComment = () => {
  //   console.log("Confirming comment:", commentText);
  //   setIsCommenting(false);
  //   setCommentText("");
  // };

  // const handleCancelComment = () => {
  //   setIsCommenting(false);
  //   setCommentText("");
  // };

  const handleMenuClickOutside = () => {
    setShowSelectionMenu(false);
    // setIsCommenting(false);
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
              ref={contentRef}
              className={clsx("p-3 rounded-md w-full bg-base-200")}
              onMouseUp={handleMouseUp}
            >
              <div
                id="readable-view"
                className="line-break px-1 reader-view read-only"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(linkContent),
                }}
              />

              {showSelectionMenu &&
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
                        <button
                          onClick={() => handleHighlightSelection("yellow")}
                          className="w-5 h-5 rounded-full bg-yellow-300 hover:opacity-70 duration-100"
                          title="Yellow Highlight"
                        />
                        <button
                          onClick={() => handleHighlightSelection("red")}
                          className="w-5 h-5 rounded-full bg-red-500 hover:opacity-70 duration-100"
                          title="Red Highlight"
                        />
                        <button
                          onClick={() => handleHighlightSelection("blue")}
                          className="w-5 h-5 rounded-full bg-blue-500 hover:opacity-70 duration-100"
                          title="Blue Highlight"
                        />
                        <button
                          onClick={() => handleHighlightSelection("green")}
                          className="w-5 h-5 rounded-full bg-green-500 hover:opacity-70 duration-100"
                          title="Green Highlight"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {/* {isCommenting ? (
                          <>
                            <button
                              onClick={handleConfirmComment}
                              className="hover:opacity-70 duration-100"
                              title="Confirm Comment"
                            >
                              <i className="bi-check2" />
                            </button>
                            <button
                              onClick={handleCancelComment}
                              className="hover:opacity-70 duration-100"
                              title="Cancel Comment"
                            >
                              <i className="bi-x" />
                            </button>
                          </>
                        ) : (
                          <>
                        <button
                          onClick={handleStartCommenting}
                          className="hover:opacity-70 duration-100"
                          title="Add Comment"
                        >
                          <i className="bi-chat-text" />
                        </button> */}
                        <button
                          onClick={() => handleHighlightSelection("yellow")}
                          className="hover:opacity-70 duration-100"
                          title="Delete"
                        >
                          <i className="bi-trash" />
                        </button>
                        {/* </>
                        )} */}
                      </div>
                    </div>
                    {/* {isCommenting && (
                      <div className="mt-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add your comment..."
                          className="resize-none w-full rounded-md p-2 h-28 mt-2 
                                     border-neutral-content bg-base-200 
                                     focus:border-primary border-solid 
                                     border outline-none duration-100"
                        />
                      </div>
                    )} */}
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
