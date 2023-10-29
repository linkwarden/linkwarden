import React, { Dispatch, SetStateAction } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import RadioButton from "./RadioButton";
import { Sort } from "@/types/global";

type Props = {
  sortBy: Sort;
  setSort: Dispatch<SetStateAction<Sort>>;

  toggleSortDropdown: Function;
};

export default function SortDropdown({
  sortBy,
  toggleSortDropdown,
  setSort,
}: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={(e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.id !== "sort-dropdown") toggleSortDropdown();
      }}
      className="absolute top-8 right-0 border border-sky-100 dark:border-neutral-700 shadow-md bg-gray-50 dark:bg-neutral-800 rounded-md p-2 z-20 w-52"
    >
      <p className="mb-2 text-black dark:text-white text-center font-semibold">
        Sort by
      </p>
      <div className="flex flex-col gap-2">
        <RadioButton
          label="Date (Newest First)"
          state={sortBy === Sort.DateNewestFirst}
          onClick={() => setSort(Sort.DateNewestFirst)}
        />

        <RadioButton
          label="Date (Oldest First)"
          state={sortBy === Sort.DateOldestFirst}
          onClick={() => setSort(Sort.DateOldestFirst)}
        />

        <RadioButton
          label="Name (A-Z)"
          state={sortBy === Sort.NameAZ}
          onClick={() => setSort(Sort.NameAZ)}
        />

        <RadioButton
          label="Name (Z-A)"
          state={sortBy === Sort.NameZA}
          onClick={() => setSort(Sort.NameZA)}
        />

        <RadioButton
          label="Description (A-Z)"
          state={sortBy === Sort.DescriptionAZ}
          onClick={() => setSort(Sort.DescriptionAZ)}
        />

        <RadioButton
          label="Description (Z-A)"
          state={sortBy === Sort.DescriptionZA}
          onClick={() => setSort(Sort.DescriptionZA)}
        />
      </div>
    </ClickAwayHandler>
  );
}
