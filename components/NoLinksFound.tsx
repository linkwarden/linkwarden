import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import useModalStore from "@/store/modals";

type Props = {
  text?: string;
};

export default function NoLinksFound({ text }: Props) {
  const { setModal } = useModalStore();

  return (
    <div className="border border-solid border-sky-100 dark:border-neutral-700 w-full h-full flex flex-col justify-center p-10 rounded-2xl bg-gray-50 dark:bg-neutral-800">
      <p className="text-center text-2xl text-black dark:text-white">
        {text || "You haven't created any Links Here"}
      </p>
      <div className="text-center text-black dark:text-white w-full mt-4">
        <div
          onClick={() => {
            setModal({
              modal: "LINK",
              state: true,
              method: "CREATE",
            });
          }}
          className="inline-flex gap-1 relative w-[11.4rem] items-center font-semibold select-none cursor-pointer p-2 px-3 rounded-full dark:hover:bg-sky-600 text-white bg-sky-700 hover:bg-sky-600 duration-100 group"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="w-5 h-5 group-hover:ml-[4.325rem] absolute duration-100"
          />
          <span className="group-hover:opacity-0 text-right w-full duration-100">
            Create New Link
          </span>
        </div>
      </div>
    </div>
  );
}
