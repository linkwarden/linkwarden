import LinkCard from "@/components/LinkCard";
import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import { faLink, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function Links() {
  const { links } = useLinkStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy });

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 justify-between items-center">
          <div className="flex gap-2">
            <FontAwesomeIcon
              icon={faLink}
              className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 drop-shadow"
            />
            <p className="sm:text-4xl text-3xl capitalize bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent font-bold">
              All Links
            </p>
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
              <SortDropdown
                sortBy={sortBy}
                setSort={setSortBy}
                toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
              />
            ) : null}
          </div>
        </div>
        {links[0] ? (
          <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
            {links.map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
          </div>
        ) : (
          <NoLinksFound />
        )}
      </div>
    </MainLayout>
  );
}
