import React, { Dispatch, SetStateAction } from "react";
import { Sort } from "@/types/global";

type Props = {
  sortBy: Sort;
  setSort: Dispatch<SetStateAction<Sort>>;
};

export default function SortDropdown({ sortBy, setSort }: Props) {
  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-square btn-ghost"
      >
        <svg
          className="w-5 h-5 text-neutral"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M3 6H12H21M6 12H18M9 18H15" stroke="currentColor"></path>
        </svg>
      </div>
      <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-xl w-52 mt-1">
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Date (Newest First)"
              checked={sortBy === Sort.DateNewestFirst}
              onChange={() => {
                setSort(Sort.DateNewestFirst);
              }}
            />
            <span className="label-text">Date (Newest First)</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Date (Oldest First)"
              checked={sortBy === Sort.DateOldestFirst}
              onChange={() => setSort(Sort.DateOldestFirst)}
            />
            <span className="label-text">Date (Oldest First)</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Name (A-Z)"
              checked={sortBy === Sort.NameAZ}
              onChange={() => setSort(Sort.NameAZ)}
            />
            <span className="label-text">Name (A-Z)</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Name (Z-A)"
              checked={sortBy === Sort.NameZA}
              onChange={() => setSort(Sort.NameZA)}
            />
            <span className="label-text">Name (Z-A)</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Description (A-Z)"
              checked={sortBy === Sort.DescriptionAZ}
              onChange={() => setSort(Sort.DescriptionAZ)}
            />
            <span className="label-text">Description (A-Z)</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="radio"
              name="sort-radio"
              className="radio checked:bg-primary"
              value="Description (Z-A)"
              checked={sortBy === Sort.DescriptionZA}
              onChange={() => setSort(Sort.DescriptionZA)}
            />
            <span className="label-text">Description (Z-A)</span>
          </label>
        </li>
      </ul>
    </div>
  );
}
