import React, { Dispatch, SetStateAction } from "react";
import { Sort } from "@/types/global";
import { dropdownTriggerer } from "@/lib/client/utils";
import { TFunction } from "i18next";

type Props = {
  sortBy: Sort;
  setSort: Dispatch<SetStateAction<Sort>>;
  t: TFunction<"translation", undefined>;
};

export default function SortDropdown({ sortBy, setSort, t }: Props) {
  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        onMouseDown={dropdownTriggerer}
        className="btn btn-sm btn-square btn-ghost border-none"
      >
        <i className="bi-chevron-expand text-neutral text-2xl"></i>
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
              checked={sortBy === Sort.DateNewestFirst}
              onChange={() => setSort(Sort.DateNewestFirst)}
            />
            <span className="label-text">{t("date_newest_first")}</span>
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
              checked={sortBy === Sort.DateOldestFirst}
              onChange={() => setSort(Sort.DateOldestFirst)}
            />
            <span className="label-text">{t("date_oldest_first")}</span>
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
              checked={sortBy === Sort.NameAZ}
              onChange={() => setSort(Sort.NameAZ)}
            />
            <span className="label-text">{t("name_az")}</span>
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
              checked={sortBy === Sort.NameZA}
              onChange={() => setSort(Sort.NameZA)}
            />
            <span className="label-text">{t("name_za")}</span>
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
              checked={sortBy === Sort.DescriptionAZ}
              onChange={() => setSort(Sort.DescriptionAZ)}
            />
            <span className="label-text">{t("description_az")}</span>
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
              checked={sortBy === Sort.DescriptionZA}
              onChange={() => setSort(Sort.DescriptionZA)}
            />
            <span className="label-text">{t("description_za")}</span>
          </label>
        </li>
      </ul>
    </div>
  );
}
