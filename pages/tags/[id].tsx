import LinkCard from "@/components/LinkCard";
import useLinkStore from "@/store/links";
import { faHashtag, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Tag } from "@prisma/client";
import useTagStore from "@/store/tags";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useLinks from "@/hooks/useLinks";

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [activeTag, setActiveTag] = useState<Tag>();

  useLinks({ tagId: Number(router.query.id), sort: sortBy });

  useEffect(() => {
    setActiveTag(tags.find((e) => e.id === Number(router.query.id)));
  }, [router, tags]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <FontAwesomeIcon
                icon={faHashtag}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-300"
              />
              <p className="sm:text-4xl text-3xl capitalize text-black dark:text-white">
                {activeTag?.name}
              </p>
            </div>
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
        <div className="grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {links
            .filter((e) => e.tags.some((e) => e.id === Number(router.query.id)))
            .map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
        </div>
      </div>
    </MainLayout>
  );
}
