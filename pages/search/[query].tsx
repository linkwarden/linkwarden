import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import LinkCard from "@/components/LinkCard";
import SortLinkDropdown from "@/components/SortLinkDropdown";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import { faFilter, faSearch, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";

type SearchFilter = {
  name: boolean;
  url: boolean;
  title: boolean;
  collection: boolean;
  tags: boolean;
};

export default function Links() {
  const { links } = useLinkStore();

  const router = useRouter();

  const routeQuery = decodeURIComponent(
    router.query.query as string
  ).toLowerCase();

  const [searchFilter, setSearchFilter] = useState<SearchFilter>({
    name: true,
    url: true,
    title: true,
    collection: true,
    tags: true,
  });

  const [filterDropdown, setFilterDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.NameAZ);
  const [sortedLinks, setSortedLinks] = useState(links);

  const handleSortChange = (e: Sort) => {
    setSortBy(e);
  };

  useEffect(() => {
    const linksArray = [
      ...links.filter((link) => {
        if (
          (searchFilter.name && link.name.toLowerCase().includes(routeQuery)) ||
          (searchFilter.url && link.url.toLowerCase().includes(routeQuery)) ||
          (searchFilter.title &&
            link.title.toLowerCase().includes(routeQuery)) ||
          (searchFilter.collection &&
            link.collection.name.toLowerCase().includes(routeQuery)) ||
          (searchFilter.tags &&
            link.tags.some((tag) =>
              tag.name.toLowerCase().includes(routeQuery)
            ))
        )
          return true;
      }),
    ];

    if (sortBy === Sort.NameAZ)
      setSortedLinks(linksArray.sort((a, b) => a.name.localeCompare(b.name)));
    else if (sortBy === Sort.TitleAZ)
      setSortedLinks(linksArray.sort((a, b) => a.title.localeCompare(b.title)));
    else if (sortBy === Sort.NameZA)
      setSortedLinks(linksArray.sort((a, b) => b.name.localeCompare(a.name)));
    else if (sortBy === Sort.TitleZA)
      setSortedLinks(linksArray.sort((a, b) => b.title.localeCompare(a.title)));
    else if (sortBy === Sort.DateNewestFirst)
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(b.createdAt as string).getTime() -
            new Date(a.createdAt as string).getTime()
        )
      );
    else if (sortBy === Sort.DateOldestFirst)
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(a.createdAt as string).getTime() -
            new Date(b.createdAt as string).getTime()
        )
      );
  }, [links, searchFilter, sortBy, router]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center mb-5">
            <div className="flex gap-2">
              <FontAwesomeIcon
                icon={faSearch}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 drop-shadow"
              />
              <p className="sm:text-4xl text-3xl capitalize bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent font-bold">
                Search Results
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative">
              <div
                onClick={() => setFilterDropdown(!filterDropdown)}
                id="filter-dropdown"
                className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
              >
                <FontAwesomeIcon
                  icon={faFilter}
                  id="filter-dropdown"
                  className="w-5 h-5 text-gray-500"
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
                className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
              >
                <FontAwesomeIcon
                  icon={faSort}
                  id="sort-dropdown"
                  className="w-5 h-5 text-gray-500"
                />
              </div>

              {sortDropdown ? (
                <SortLinkDropdown
                  handleSortChange={handleSortChange}
                  sortBy={sortBy}
                  toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
                />
              ) : null}
            </div>
          </div>
        </div>
        {sortedLinks[0] ? (
          sortedLinks.map((e, i) => {
            return <LinkCard key={i} link={e} count={i} />;
          })
        ) : (
          <p className="text-sky-900">
            Nothing found.{" "}
            <span className="text-sky-500 font-bold text-xl" title="Shruggie">
              ¯\_(ツ)_/¯
            </span>
          </p>
        )}
      </div>
    </MainLayout>
  );
}
