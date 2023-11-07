import React, { useRef, useEffect, ReactNode, RefObject } from "react";

type Props = {
  children: ReactNode;
  onClickOutside: Function;
  className?: string;
  style?: React.CSSProperties;
  onMount?: (rect: DOMRect) => void;
};

function useOutsideAlerter(
  ref: RefObject<HTMLElement>,
  onClickOutside: Function
) {
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        ref.current &&
        !ref.current.contains(event.target as HTMLInputElement)
      ) {
        onClickOutside(event);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
