import React, { MouseEventHandler, ReactNode, useEffect } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";

type Props = {
  toggleModal: Function;
  children: ReactNode;
  className?: string;
};

export default function Modal({ toggleModal, className, children }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  });

  return (
    <div className="overflow-y-auto pt-2 sm:py-2 fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex justify-center items-center fade-in z-30">
      <ClickAwayHandler
        onClickOutside={toggleModal}
        className={`w-full mt-auto sm:m-auto sm:w-11/12 sm:max-w-2xl ${
          className || ""
        }`}
      >
        <div className="slide-up mt-auto sm:m-auto relative border-neutral-content rounded-t-2xl sm:rounded-2xl border-t sm:border shadow-2xl p-5 bg-base-100 overflow-y-auto sm:overflow-y-visible">
          <div
            onClick={toggleModal as MouseEventHandler<HTMLDivElement>}
            className="absolute top-4 right-3 btn btn-sm outline-none btn-circle btn-ghost z-10"
          >
            <i className="bi-x text-neutral text-2xl"></i>
          </div>
          {children}
        </div>
      </ClickAwayHandler>
    </div>
  );
}
