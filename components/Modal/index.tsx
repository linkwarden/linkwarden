import { MouseEventHandler, ReactNode } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

type Props = {
  toggleModal: Function;
  children: ReactNode;
  className?: string;
};

export default function Modal({ toggleModal, className, children }: Props) {
  return (
    <div className="overflow-y-auto py-2 fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex justify-center items-center fade-in z-30">
      <ClickAwayHandler
        onClickOutside={toggleModal}
        className={`m-auto ${className}`}
      >
        <div className="slide-up relative border-sky-100 dark:border-sky-800 rounded-2xl border-solid border shadow-lg p-5 bg-white dark:bg-blue-950">
          <div
            onClick={toggleModal as MouseEventHandler<HTMLDivElement>}
            className="absolute top-5 left-5 inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-sky-800 duration-100 z-20 p-2"
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="w-4 h-4 text-gray-500 dark:text-gray-200"
            />
          </div>
          {children}
        </div>
      </ClickAwayHandler>
    </div>
  );
}
