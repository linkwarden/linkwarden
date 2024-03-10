import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
// import GridView from "@/components/LinkViews/Layouts/GridView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import PageHeader from "@/components/PageHeader";
import { GridLoader, PropagateLoader } from "react-spinners";

export default function Search() {
  const { links } = useLinkStore();

  const router = useRouter();

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    tags: true,
    textContent: false,
  });

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const { isLoading } = useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
    searchByName: searchFilter.name,
    searchByUrl: searchFilter.url,
    searchByDescription: searchFilter.description,
    searchByTextContent: searchFilter.textContent,
    searchByTags: searchFilter.tags,
  });

  useEffect(() => {
    console.log("isLoading", isLoading);
  }, [isLoading]);

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <PageHeader icon={"bi-search"} title={"Search Results"} />

          <div className="flex gap-3 items-center justify-end">
            <div className="flex gap-2 items-center mt-2">
              <FilterSearchDropdown
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
              />
              <SortDropdown sortBy={sortBy} setSort={setSortBy} />
              <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>
        </div>

        {!isLoading && !links[0] ? (
          <p>
            Nothing found.{" "}
            <span className="font-bold text-xl" title="Shruggie">
              ¯\_(ツ)_/¯
            </span>
          </p>
        ) : links[0] ? (
          <LinkComponent links={links} isLoading={isLoading} />
        ) : (
          isLoading && (
            <GridLoader
              color="oklch(var(--p))"
              loading={true}
              size={20}
              className="m-auto py-10"
            />
          )
        )}
      </div>
    </MainLayout>
  );
}
