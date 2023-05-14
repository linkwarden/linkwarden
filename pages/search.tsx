// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import LinkList from "@/components/LinkList";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import useSearchSettingsStore from "@/store/search";
import { ExtendedLink } from "@/types/global";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

export default function Links() {
  const { links } = useLinkStore();

  const [filteredLinks, setFilteredLinks] = useState<ExtendedLink[]>([]);

  const { searchSettings } = useSearchSettingsStore();

  useEffect(() => {
    const { name, url, title, collection, tags } = searchSettings.filter;

    const filter = links.filter((link) => {
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
    });

    setFilteredLinks(filter);
  }, [searchSettings, links]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-sky-300" />
            <p className="text-lg text-sky-900">Search Results</p>
          </div>
        </div>
        {filteredLinks[0] ? (
          filteredLinks.map((e, i) => {
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
