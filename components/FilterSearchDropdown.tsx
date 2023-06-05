import React, { SetStateAction } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import Checkbox from "./Checkbox";
import { SearchSettings } from "@/types/global";

type Props = {
  setFilterDropdown: (value: SetStateAction<boolean>) => void;
  toggleCheckbox: (
    name: "name" | "title" | "url" | "collection" | "tags"
  ) => void;
  searchSettings: SearchSettings;
};

export default function FilterSearchDropdown({
  setFilterDropdown,
  toggleCheckbox,
  searchSettings,
}: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={(e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.id !== "filter-dropdown") setFilterDropdown(false);
      }}
      className="absolute top-8 right-0 shadow-md bg-gray-50 rounded-md p-2 z-20 w-40"
    >
      <p className="mb-2 text-sky-900 text-center font-semibold">Filter by</p>
      <div className="flex flex-col gap-2">
        <Checkbox
          label="Name"
          state={searchSettings.filter.name}
          onClick={() => toggleCheckbox("name")}
        />
        <Checkbox
          label="Link"
          state={searchSettings.filter.url}
          onClick={() => toggleCheckbox("url")}
        />
        <Checkbox
          label="Title"
          state={searchSettings.filter.title}
          onClick={() => toggleCheckbox("title")}
        />
        <Checkbox
          label="Collection"
          state={searchSettings.filter.collection}
          onClick={() => toggleCheckbox("collection")}
        />
        <Checkbox
          label="Tags"
          state={searchSettings.filter.tags}
          onClick={() => toggleCheckbox("tags")}
        />
      </div>
    </ClickAwayHandler>
  );
}
