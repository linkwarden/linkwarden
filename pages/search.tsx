import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import LinkCard from "@/components/LinkCard";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import { faFilter, faSearch, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useState } from "react";

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
  const [sortDropdown, setSortDropdown] = useState(false);
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

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center mb-5">
            <div className="flex gap-2">
              <FontAwesomeIcon
                icon={faSearch}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-500 drop-shadow"
              />
              <p className="sm:text-4xl text-3xl capitalize text-black dark:text-white font-thin">
                Search Results
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative">
              <div
                onClick={() => setFilterDropdown(!filterDropdown)}
                id="filter-dropdown"
                className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
              >
                <FontAwesomeIcon
                  icon={faFilter}
                  id="filter-dropdown"
                  className="w-5 h-5 text-gray-500 dark:text-gray-300"
                />
              </div>

              {filterDropdown ? (
                <FilterSearchDropdown
                  setFilterDropdown={setFilterDropdown}
                  searchFilter={searchFilter}
                  setSearchFilter={setSearchFilter}
                />
              ) : null}
            </div>

            <div className="relative">
              <div
                onClick={() => setSortDropdown(!sortDropdown)}
                id="sort-dropdown"
                className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
              >
                <FontAwesomeIcon
                  icon={faSort}
                  id="sort-dropdown"
                  className="w-5 h-5 text-gray-500 dark:text-gray-300"
                />
              </div>

              {sortDropdown ? (
                <SortDropdown
                  sortBy={sortBy}
                  setSort={setSortBy}
                  toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
                />
              ) : null}
            </div>
          </div>
        </div>
        {links[0] ? (
          <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
            {links.map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
          </div>
        ) : (
          <p className="text-black dark:text-white">
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
