// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useRef, useEffect, ReactNode, RefObject } from "react";

type Props = {
  children: ReactNode;
  onClickOutside: Function;
  className?: string;
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

export default function ({ children, onClickOutside, className }: Props) {
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, onClickOutside);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
}
