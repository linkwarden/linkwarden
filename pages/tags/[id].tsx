// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import LinkList from "@/components/LinkList";
import useLinkStore from "@/store/links";
import { faHashtag, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import RadioButton from "@/components/RadioButton";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { Tag } from "@prisma/client";
import useTagStore from "@/store/tags";
import SortLinkDropdown from "@/components/SortLinkDropdown";

export default function () {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const [activeTag, setActiveTag] = useState<Tag>();

  const [sortedLinks, setSortedLinks] = useState(links);

  const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value);
  };

  useEffect(() => {
    setActiveTag(tags.find((e) => e.id === Number(router.query.id)));

    // Sorting logic

    const linksArray = [
      ...links.filter((e) =>
        e.tags.some((e) => e.id === Number(router.query.id))
      ),
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
  }, [links, router, tags, sortBy]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center">
              <FontAwesomeIcon
                icon={faHashtag}
                className="w-5 h-5 text-sky-300"
              />
              <p className="text-lg text-sky-900">{activeTag?.name}</p>
            </div>
          </div>

          <div className="relative">
            <div
              onClick={() => setSortDropdown(!sortDropdown)}
              id="sort-dropdown"
              className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
            >
              <FontAwesomeIcon
                icon={faSort}
                id="sort-dropdown"
                className="w-5 h-5 text-gray-500"
              />
            </div>

            {sortDropdown ? (
              <SortLinkDropdown
                handleSortChange={(e) => setSortBy(e.target.value)}
                sortBy={sortBy}
                toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
              />
            ) : null}
          </div>
        </div>
        <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {sortedLinks.map((e, i) => {
            return <LinkList key={i} link={e} count={i} />;
          })}
        </div>
      </div>
    </MainLayout>
  );
}
