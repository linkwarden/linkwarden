import React, { useRef, useEffect, ReactNode, RefObject } from "react";

interface Props {
  children: ReactNode;
  onClickOutside: Function;
  className?: string;
}

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
        onClickOutside();
      }
    }
    // Bind the event listener
    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [ref, onClickOutside]);
}

export default function ({ children, onClickOutside, className }: Props) {
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, onClickOutside);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
}
