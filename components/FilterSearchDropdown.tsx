import React, { SetStateAction } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import Checkbox from "./Checkbox";

type Props = {
  setFilterDropdown: (value: SetStateAction<boolean>) => void;
  setSearchFilter: Function;
  searchFilter: {
    name: boolean;
    url: boolean;
    description: boolean;
    textContent: boolean;
    tags: boolean;
  };
};

export default function FilterSearchDropdown({
  setFilterDropdown,
  setSearchFilter,
  searchFilter,
}: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={(e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.id !== "filter-dropdown") setFilterDropdown(false);
      }}
      className="absolute top-8 right-0 border border-sky-100 dark:border-neutral-700 shadow-md bg-gray-50 dark:bg-neutral-800 rounded-md p-2 z-20 w-40"
    >
      <p className="mb-2 text-black dark:text-white text-center font-semibold">
        Filter by
      </p>
      <div className="flex flex-col gap-2">
        <Checkbox
          label="Name"
          state={searchFilter.name}
          onClick={() =>
            setSearchFilter({ ...searchFilter, name: !searchFilter.name })
          }
        />
        <Checkbox
          label="Link"
          state={searchFilter.url}
          onClick={() =>
            setSearchFilter({ ...searchFilter, url: !searchFilter.url })
          }
        />
        <Checkbox
          label="Description"
          state={searchFilter.description}
          onClick={() =>
            setSearchFilter({
              ...searchFilter,
              description: !searchFilter.description,
            })
          }
        />
        <Checkbox
          label="Text Content"
          state={searchFilter.textContent}
          onClick={() =>
            setSearchFilter({
              ...searchFilter,
              textContent: !searchFilter.textContent,
            })
          }
        />
        <Checkbox
          label="Tags"
          state={searchFilter.tags}
          onClick={() =>
            setSearchFilter({ ...searchFilter, tags: !searchFilter.tags })
          }
        />
      </div>
    </ClickAwayHandler>
  );
}
