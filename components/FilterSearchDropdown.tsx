import { dropdownTriggerer } from "@/lib/client/utils";
import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { resetInfiniteQueryPagination } from "@/hooks/store/links";
import { useQueryClient } from "@tanstack/react-query";

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        onMouseDown={dropdownTriggerer}
        className="btn btn-sm btn-square btn-ghost"
      >
        <i className="bi-funnel text-neutral text-2xl"></i>
      </div>
      <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1">
        <li>
          <label
            className="label cursor-pointer flex justify-start"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary"
              checked={searchFilter.name}
              onChange={() => {
                resetInfiniteQueryPagination(queryClient, ["links"]);
                setSearchFilter({ ...searchFilter, name: !searchFilter.name });
              }}
            />
            <span className="label-text whitespace-nowrap">{t("name")}</span>
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
              className="checkbox checkbox-primary"
              checked={searchFilter.url}
              onChange={() => {
                resetInfiniteQueryPagination(queryClient, ["links"]);
                setSearchFilter({ ...searchFilter, url: !searchFilter.url });
              }}
            />
            <span className="label-text whitespace-nowrap">{t("link")}</span>
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
              className="checkbox checkbox-primary"
              checked={searchFilter.description}
              onChange={() => {
                resetInfiniteQueryPagination(queryClient, ["links"]);
                setSearchFilter({
                  ...searchFilter,
                  description: !searchFilter.description,
                });
              }}
            />
            <span className="label-text whitespace-nowrap">
              {t("description")}
            </span>
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
              className="checkbox checkbox-primary"
              checked={searchFilter.tags}
              onChange={() => {
                resetInfiniteQueryPagination(queryClient, ["links"]);
                setSearchFilter({ ...searchFilter, tags: !searchFilter.tags });
              }}
            />
            <span className="label-text whitespace-nowrap">{t("tags")}</span>
          </label>
        </li>
        <li>
          <label
            className="label cursor-pointer flex justify-between"
            tabIndex={0}
            role="button"
          >
            <input
              type="checkbox"
              name="search-filter-checkbox"
              className="checkbox checkbox-primary"
              checked={searchFilter.textContent}
              onChange={() => {
                resetInfiniteQueryPagination(queryClient, ["links"]);
                setSearchFilter({
                  ...searchFilter,
                  textContent: !searchFilter.textContent,
                });
              }}
            />
            <span className="label-text whitespace-nowrap">
              {t("full_content")}
            </span>
            <div className="ml-auto badge badge-sm badge-neutral whitespace-nowrap">
              {t("slower")}
            </div>
          </label>
        </li>
      </ul>
    </div>
  );
}
