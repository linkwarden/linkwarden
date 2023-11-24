import LinkCard from "@/components/LinkCard";
import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import { faSort, faThumbTack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function PinnedLinks() {
  const { links } = useLinkStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy, pinnedOnly: true });

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex gap-3 justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faThumbTack}
              className="sm:w-10 sm:h-10 w-6 h-6 text-sky-500 dark:text-sky-500 drop-shadow"
            />
            <div>
              <p className="text-3xl capitalize font-thin">Pinned Links</p>

              <p>Pinned Links from your Collections</p>
            </div>
          </div>

          <div className="relative mt-2">
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
        {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
          <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
            {links.map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
          </div>
        ) : (
          <div
            style={{ flex: "1 1 auto" }}
            className="sky-shadow flex flex-col justify-center h-full border border-solid border-sky-100 dark:border-neutral-700 w-full mx-auto p-10 rounded-2xl bg-gray-50 dark:bg-neutral-800"
          >
            <p className="text-center text-2xl">
              Pin Your Favorite Links Here!
            </p>
            <p className="text-center mx-auto max-w-96 w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
              You can Pin your favorite Links by clicking on the three dots on
              each Link and clicking{" "}
              <span className="font-semibold">Pin to Dashboard</span>.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
