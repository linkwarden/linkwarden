import LinkCard from "@/components/LinkCard";
import useLinkStore from "@/store/links";
import { faHashtag, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Tag } from "@prisma/client";
import useTagStore from "@/store/tags";
import SortLinkDropdown from "@/components/SortLinkDropdown";
import { Sort } from "@/types/global";

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.NameAZ);

  const [activeTag, setActiveTag] = useState<Tag>();

  const [sortedLinks, setSortedLinks] = useState(links);

  const handleSortChange = (e: Sort) => {
    setSortBy(e);
  };

  useEffect(() => {
    setActiveTag(tags.find((e) => e.id === Number(router.query.id)));

    // Sorting logic

    const linksArray = [
      ...links.filter((e) =>
        e.tags.some((e) => e.id === Number(router.query.id))
      ),
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
  }, [links, router, tags, sortBy]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <FontAwesomeIcon
                icon={faHashtag}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500"
              />
              <p className="sm:text-4xl text-3xl capitalize bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent font-bold">
                {activeTag?.name}
              </p>
            </div>
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
        <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {sortedLinks.map((e, i) => {
            return <LinkCard key={i} link={e} count={i} />;
          })}
        </div>
      </div>
    </MainLayout>
  );
}
