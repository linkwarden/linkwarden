import React, { ChangeEvent } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import RadioButton from "./RadioButton";

type Props = {
  handleSortChange: (e: ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
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
      className="absolute top-8 right-0 shadow-md bg-gray-50 rounded-md p-2 z-10 border border-sky-100 w-48"
    >
      <p className="mb-2 text-sky-900 text-center font-semibold">Sort by</p>
      <div className="flex flex-col gap-2">
        <RadioButton
          label="Name (A-Z)"
          state={sortBy === "Name (A-Z)"}
          onClick={handleSortChange}
        />

        <RadioButton
          label="Name (Z-A)"
          state={sortBy === "Name (Z-A)"}
          onClick={handleSortChange}
        />

        <RadioButton
          label="Title (A-Z)"
          state={sortBy === "Title (A-Z)"}
          onClick={handleSortChange}
        />

        <RadioButton
          label="Title (Z-A)"
          state={sortBy === "Title (Z-A)"}
          onClick={handleSortChange}
        />

        <RadioButton
          label="Date (Newest First)"
          state={sortBy === "Date (Newest First)"}
          onClick={handleSortChange}
        />

        <RadioButton
          label="Date (Oldest First)"
          state={sortBy === "Date (Oldest First)"}
          onClick={handleSortChange}
        />
      </div>
    </ClickAwayHandler>
  );
}
