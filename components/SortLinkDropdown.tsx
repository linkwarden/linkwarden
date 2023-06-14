import React, { ChangeEvent } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import RadioButton from "./RadioButton";
import { Sort } from "@/types/global";

type Props = {
  handleSortChange: (e: Sort) => void;
  sortBy: Sort;
  toggleSortDropdown: Function;
};

export default function SortLinkDropdown({
  handleSortChange,
  sortBy,
  toggleSortDropdown,
}: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={(e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.id !== "sort-dropdown") toggleSortDropdown();
      }}
      className="absolute top-8 right-0 border border-sky-100 shadow-md bg-gray-50 rounded-md p-2 z-10 w-48"
    >
      <p className="mb-2 text-sky-900 text-center font-semibold">Sort by</p>
      <div className="flex flex-col gap-2">
        <RadioButton
          label="Name (A-Z)"
          state={sortBy === Sort.NameAZ}
          onClick={() => handleSortChange(Sort.NameAZ)}
        />

        <RadioButton
          label="Name (Z-A)"
          state={sortBy === Sort.NameZA}
          onClick={() => handleSortChange(Sort.NameZA)}
        />

        <RadioButton
          label="Title (A-Z)"
          state={sortBy === Sort.TitleAZ}
          onClick={() => handleSortChange(Sort.TitleAZ)}
        />

        <RadioButton
          label="Title (Z-A)"
          state={sortBy === Sort.TitleZA}
          onClick={() => handleSortChange(Sort.TitleZA)}
        />

        <RadioButton
          label="Date (Newest First)"
          state={sortBy === Sort.DateNewestFirst}
          onClick={() => handleSortChange(Sort.DateNewestFirst)}
        />

        <RadioButton
          label="Date (Oldest First)"
          state={sortBy === Sort.DateOldestFirst}
          onClick={() => handleSortChange(Sort.DateOldestFirst)}
        />
      </div>
    </ClickAwayHandler>
  );
}
