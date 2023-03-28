import { ReactNode } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";

type Props = {
  toggleModal: Function;
  children: ReactNode;
};

export default function ({ toggleModal, children }: Props) {
  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in z-30">
      <ClickAwayHandler onClickOutside={toggleModal} className="w-fit mx-auto">
        <div className="slide-up border-sky-100 rounded-md border-solid border shadow-lg p-5 bg-white">
          {children}
        </div>
      </ClickAwayHandler>
    </div>
  );
}
