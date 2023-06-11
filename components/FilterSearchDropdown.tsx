import React, { SetStateAction } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import Checkbox from "./Checkbox";

type Props = {
  setFilterDropdown: (value: SetStateAction<boolean>) => void;
  setSearchFilter: Function;
  searchFilter: {
    name: boolean;
    url: boolean;
    title: boolean;
    collection: boolean;
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
      className="absolute top-8 right-0 border border-sky-100 shadow-md bg-gray-50 rounded-md p-2 z-20 w-40"
    >
      <p className="mb-2 text-sky-900 text-center font-semibold">Filter by</p>
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
          label="Title"
          state={searchFilter.title}
          onClick={() =>
            setSearchFilter({ ...searchFilter, title: !searchFilter.title })
          }
        />
        <Checkbox
          label="Collection"
          state={searchFilter.collection}
          onClick={() =>
            setSearchFilter({
              ...searchFilter,
              collection: !searchFilter.collection,
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
