import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { faFilter, faSearch, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useState } from "react";
import ViewDropdown from "@/components/ViewDropdown";
import DefaultView from "@/components/LinkViews/DefaultView";
import GridView from "@/components/LinkViews/GridView";
import ListView from "@/components/LinkViews/ListView";

export default function Search() {
  const { links } = useLinkStore();

  const router = useRouter();

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    textContent: true,
    tags: true,
  });

  const [filterDropdown, setFilterDropdown] = useState(false);

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Default
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
    searchByName: searchFilter.name,
    searchByUrl: searchFilter.url,
    searchByDescription: searchFilter.description,
    searchByTextContent: searchFilter.textContent,
    searchByTags: searchFilter.tags,
  });

  const linkView = {
    [ViewMode.Default]: DefaultView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faSearch}
                className="sm:w-8 sm:h-8 w-8 h-8 text-primary drop-shadow"
              />
              <p className="sm:text-4xl text-3xl capitalize font-thin">
                Search Results
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center mt-2">
            <FilterSearchDropdown
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
            />
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        {links[0] ? (
          <LinkComponent links={links} />
        ) : (
          <p>
            Nothing found.{" "}
            <span className="font-bold text-xl" title="Shruggie">
              ¯\_(ツ)_/¯
            </span>
          </p>
        )}
      </div>
    </MainLayout>
  );
}
