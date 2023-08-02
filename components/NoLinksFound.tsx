import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import useModalStore from "@/store/modals";

export default function NoLinksFound() {
  const { setModal } = useModalStore();

  return (
    <div className="border border-solid border-sky-100 dark:border-sky-800 w-full p-10 rounded-2xl">
      <p className="text-center text-3xl text-sky-700 dark:text-white">
        You haven&apos;t created any Links Here
      </p>
      <br />
      <div className="text-center text-sky-900 dark:text-white text-sm flex items-baseline justify-center gap-1 w-full">
        <p>Start by creating a</p>{" "}
        <div
          onClick={() => {
            setModal({
              modal: "LINK",
              state: true,
              method: "CREATE",
            });
          }}
          className="inline-flex gap-1 relative w-[7.2rem] items-center font-semibold select-none cursor-pointer p-2 px-3 rounded-full text-white bg-sky-700 dark:bg-sky-400 hover:bg-sky-600 duration-100 group"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="w-5 h-5 group-hover:ml-9 absolute duration-100"
          />
          <span className="block group-hover:opacity-0 text-right w-full duration-100">
            New Link
          </span>
        </div>
      </div>
    </div>
  );
}
