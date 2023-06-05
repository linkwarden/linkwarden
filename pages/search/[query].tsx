import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import LinkList from "@/components/LinkList";
import SortLinkDropdown from "@/components/SortLinkDropdown";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import useSearchSettingsStore from "@/store/search";
import { faFilter, faSearch, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, useEffect, useState } from "react";

export default function Links() {
  const { links } = useLinkStore();

  const [filterDropdown, setFilterDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  const [sortedLinks, setSortedLinks] = useState(links);
  const { searchSettings, toggleCheckbox } = useSearchSettingsStore();

  const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value);
  };

  const { name, url, title, collection, tags } = searchSettings.filter;

  useEffect(() => {
    const linksArray = [
      ...links.filter((link) => {
        const query = searchSettings.query.toLowerCase();

        if (
          (name && link.name.toLowerCase().includes(query)) ||
          (url && link.url.toLowerCase().includes(query)) ||
          (title && link.title.toLowerCase().includes(query)) ||
          (collection && link.collection.name.toLowerCase().includes(query)) ||
          (tags &&
            link.tags.some((tag) => tag.name.toLowerCase().includes(query)))
        )
          return true;
      }),
    ];

    if (sortBy === "Name (A-Z)")
      setSortedLinks(linksArray.sort((a, b) => a.name.localeCompare(b.name)));
    else if (sortBy === "Title (A-Z)")
      setSortedLinks(linksArray.sort((a, b) => a.title.localeCompare(b.title)));
    else if (sortBy === "Name (Z-A)")
      setSortedLinks(linksArray.sort((a, b) => b.name.localeCompare(a.name)));
    else if (sortBy === "Title (Z-A)")
      setSortedLinks(linksArray.sort((a, b) => b.title.localeCompare(a.title)));
    else if (sortBy === "Date (Newest First)")
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(b.createdAt as string).getTime() -
            new Date(a.createdAt as string).getTime()
        )
      );
    else if (sortBy === "Date (Oldest First)")
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(a.createdAt as string).getTime() -
            new Date(b.createdAt as string).getTime()
        )
      );
  }, [searchSettings, links, sortBy]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-sky-300" />
            <p className="text-lg text-sky-900">Search Results</p>
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
                  searchSettings={searchSettings}
                  toggleCheckbox={toggleCheckbox}
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
            return <LinkList key={i} link={e} count={i} />;
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
