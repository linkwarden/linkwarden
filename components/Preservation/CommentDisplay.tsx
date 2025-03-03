import { useUpdateFile } from "@/hooks/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Editor } from "@tiptap/react";
import DOMPurify from "dompurify";
import React, { useState, useEffect, useRef, useCallback } from "react";

const CommentDisplay = ({
  editor,
  setLinkContent,
  link,
}: {
  editor: Editor;
  setLinkContent: React.Dispatch<React.SetStateAction<string>>;
  link: LinkIncludingShortenedCollectionAndTags;
}) => {
  const [comments, setComments] = useState<{
    [key: string]: {
      position: { x: number; y: number };
      visible: boolean;
      id: string;
      content: string;
    };
  }>({});

  const timeoutRef = useRef<{ [key: string]: number }>({});
  const updateFile = useUpdateFile();
  const debounceTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback((event: MouseEvent) => {
    const element = event.target as HTMLElement;
    const commentId = element.getAttribute("data-comment-id");
    const commentContent = element.getAttribute("data-comment-content") || "";

    if (!commentId) return;

    if (timeoutRef.current[commentId]) {
      window.clearTimeout(timeoutRef.current[commentId]);
      delete timeoutRef.current[commentId];
    }

    const rect = element.getBoundingClientRect();

    setComments((prev) => ({
      ...prev,
      [commentId]: {
        position: {
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY,
        },
        visible: true,
        id: commentId,
        content: commentContent,
      },
    }));
  }, []);

  const handleMouseLeave = useCallback((event: MouseEvent) => {
    const element = event.target as HTMLElement;
    const commentId = element.getAttribute("data-comment-id");
    if (!commentId) return;

    timeoutRef.current[commentId] = window.setTimeout(() => {
      setComments((prev) => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          visible: false,
        },
      }));
      delete timeoutRef.current[commentId];
    }, 300);
  }, []);

  const attachEventListeners = useCallback(() => {
    const oldElements = document.querySelectorAll(".linkwarden-comment");
    oldElements.forEach((element) => {
      element.removeEventListener(
        "mouseenter",
        handleMouseEnter as EventListener
      );
      element.removeEventListener(
        "mouseleave",
        handleMouseLeave as EventListener
      );
    });

    const commentElements = document.querySelectorAll(".linkwarden-comment");
    commentElements.forEach((element) => {
      element.addEventListener("mouseenter", handleMouseEnter as EventListener);
      element.addEventListener("mouseleave", handleMouseLeave as EventListener);
    });
  }, [handleMouseEnter, handleMouseLeave]);

  useEffect(() => {
    attachEventListeners();

    return () => {
      const commentElements = document.querySelectorAll(".linkwarden-comment");
      commentElements.forEach((element) => {
        element.removeEventListener(
          "mouseenter",
          handleMouseEnter as EventListener
        );
        element.removeEventListener(
          "mouseleave",
          handleMouseLeave as EventListener
        );
      });

      Object.values(timeoutRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [attachEventListeners, handleMouseEnter, handleMouseLeave]);

  useEffect(() => {
    const handleUpdate = () => {
      setTimeout(attachEventListeners, 100);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, attachEventListeners]);

  const handlePopupMouseEnter = (commentId: string) => {
    if (timeoutRef.current[commentId]) {
      window.clearTimeout(timeoutRef.current[commentId]);
      delete timeoutRef.current[commentId];
    }

    setComments((prev) => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        visible: true,
      },
    }));
  };

  const handlePopupMouseLeave = (commentId: string) => {
    timeoutRef.current[commentId] = window.setTimeout(() => {
      setComments((prev) => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          visible: false,
        },
      }));
      delete timeoutRef.current[commentId];
    }, 300);
  };

  const debouncedUpdateContent = useCallback(
    (html: string) => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = window.setTimeout(() => {
        setLinkContent(html);
        updateFile.mutate({
          linkId: link.id as number,
          file: new File([html], "updatedContent.txt", {
            type: "text/plain",
          }),
        });
        debounceTimeoutRef.current = null;

        setTimeout(attachEventListeners, 150);
      }, 1000);
    },
    [setLinkContent, updateFile, link.id, attachEventListeners]
  );

  const handleCommentChange = (commentId: string, newContent: string) => {
    setComments((prev) => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        content: newContent,
      },
    }));

    editor.commands.setCommentContent(commentId, newContent);

    const updatedHTML = DOMPurify.sanitize(editor.getHTML());
    debouncedUpdateContent(updatedHTML);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== commentId)
      )
    );
    editor.commands.unsetComment(commentId);
    const updatedHTML = DOMPurify.sanitize(editor.getHTML());

    setLinkContent(updatedHTML);

    updateFile.mutate({
      linkId: link.id as number,
      file: new File([updatedHTML], "updatedContent.txt", {
        type: "text/plain",
      }),
    });
  };

  return (
    <>
      {Object.entries(comments).map(
        ([commentId, comment]) =>
          comment.visible && (
            <div
              key={commentId}
              className="fixed z-50 bg-base-100 shadow-lg rounded-lg p-4 w-full max-w-[300px]"
              style={{
                left: `${comment.position.x}px`,
                top: `${comment.position.y + 8}px`,
                transform: "translateX(-50%)",
              }}
              onMouseEnter={() => handlePopupMouseEnter(commentId)}
              onMouseLeave={() => handlePopupMouseLeave(commentId)}
            >
              <div className="flex items-start gap-2 ">
                <div className="flex flex-col gap-1 w-full">
                  <div className="w-full flex items-center justify-between">
                    <label className="text-lg flex items-center gap-2">
                      <i className="bi bi-chat-square-dots text-base text-primary" />
                      Comment
                    </label>
                    <button onClick={() => handleDeleteComment(commentId)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <textarea
                    value={comment.content}
                    onChange={(e) =>
                      handleCommentChange(commentId, e.target.value)
                    }
                    placeholder="Write your comment here..."
                    className="resize-none w-full rounded-md p-2 border-neutral-content bg-base-100 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100"
                  />
                </div>
              </div>
            </div>
          )
      )}
    </>
  );
};

export default CommentDisplay;
