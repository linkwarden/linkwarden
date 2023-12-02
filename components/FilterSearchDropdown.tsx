import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

type Props = {
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
  setSearchFilter,
  searchFilter,
}: Props) {
  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-square btn-ghost"
      >
        <FontAwesomeIcon
          icon={faFilter}
          id="sort-dropdown"
          className="w-5 h-5 text-neutral"
        />
      </div>
      <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box w-44 mt-1">
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary [--chkfg:white]"
              checked={searchFilter.name}
              onChange={() => {
                setSearchFilter({ ...searchFilter, name: !searchFilter.name });
              }}
            />
            <span className="label-text">Name</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary [--chkfg:white]"
              checked={searchFilter.url}
              onChange={() => {
                setSearchFilter({ ...searchFilter, url: !searchFilter.url });
              }}
            />
            <span className="label-text">Link</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary [--chkfg:white]"
              checked={searchFilter.description}
              onChange={() => {
                setSearchFilter({
                  ...searchFilter,
                  description: !searchFilter.description,
                });
              }}
            />
            <span className="label-text">Description</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary [--chkfg:white]"
              checked={searchFilter.textContent}
              onChange={() => {
                setSearchFilter({
                  ...searchFilter,
                  textContent: !searchFilter.textContent,
                });
              }}
            />
            <span className="label-text">Full Content</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary [--chkfg:white]"
              checked={searchFilter.tags}
              onChange={() => {
                setSearchFilter({
                  ...searchFilter,
                  tags: !searchFilter.tags,
                });
              }}
            />
            <span className="label-text">Tags</span>
          </label>
        </li>
      </ul>
    </div>
  );
}
