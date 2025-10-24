import React, { useRef, useEffect, ReactNode, RefObject } from "react";

type Props = {
  children: ReactNode;
  onClickOutside: Function;
  className?: string;
  style?: React.CSSProperties;
  onMount?: (rect: DOMRect) => void;
};

function getZIndex(element: HTMLElement): number {
  let zIndex = 0;
  while (element) {
    const zIndexStyle = window
      .getComputedStyle(element)
      .getPropertyValue("z-index");
    const numericZIndex = Number(zIndexStyle);
    if (zIndexStyle !== "auto" && !isNaN(numericZIndex)) {
      zIndex = numericZIndex;
      break;
    }
    element = element.parentElement as HTMLElement;
  }
  return zIndex;
}

function useOutsideAlerter(
  ref: RefObject<HTMLElement>,
  onClickOutside: Function
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedElement = event.target as HTMLElement;

      if (clickedElement.closest("[data-ignore-click-away]")) {
        return;
      }

      if (ref.current && !ref.current.contains(clickedElement)) {
        const refZIndex = getZIndex(ref.current);
        const clickedZIndex = getZIndex(clickedElement);
        if (clickedZIndex <= refZIndex) {
          onClickOutside(event);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClickOutside(event);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, onClickOutside]);
}

export default function ClickAwayHandler({
  children,
  onClickOutside,
  className,
  style,
  onMount,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useOutsideAlerter(wrapperRef, onClickOutside);

  useEffect(() => {
    if (wrapperRef.current && onMount) {
      const rect = wrapperRef.current.getBoundingClientRect();
      onMount(rect); // Pass the bounding rectangle to the parent
    }
  }, []);

  return (
    <div ref={wrapperRef} className={className} style={style}>
      {children}
    </div>
  );
}
