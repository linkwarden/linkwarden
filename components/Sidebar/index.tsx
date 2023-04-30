// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faBox,
  faHashtag,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import SidebarItem from "./SidebarItem";
import useTagStore from "@/store/tags";
import Link from "next/link";

export default function () {
  const { collections } = useCollectionStore();

  const { tags } = useTagStore();

  return (
    <div className="bg-gray-100 h-screen w-64 xl:w-80 p-2 overflow-y-auto border-solid border-r-sky-100 border z-20">
      <p className="p-2 text-sky-500 font-bold text-xl mb-5 leading-4">
        Linkwarden
      </p>

      <Link href="/links">
        <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 text-sky-900 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2">
          <FontAwesomeIcon icon={faBookmark} className="w-4 text-sky-300" />
          <p>All Links</p>
        </div>
      </Link>

      <Link href="/collections">
        <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 text-sky-900 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2">
          <FontAwesomeIcon icon={faBox} className="w-4 text-sky-300" />
          <p>All Collections</p>
        </div>
      </Link>

      <div className="text-gray-500 mt-5">
        <p className="text-sm p-2">Collections</p>
      </div>
      <div>
        {collections.map((e, i) => {
          return (
            <SidebarItem
              key={i}
              text={e.name}
              icon={<FontAwesomeIcon icon={faFolder} />}
              path={`/collections/${e.id}`}
            />
          );
        })}
      </div>
      <div className="text-gray-500 mt-5">
        <p className="text-sm p-2">Tags</p>
      </div>
      <div>
        {tags.map((e, i) => {
          return (
            <SidebarItem
              key={i}
              text={e.name}
              icon={<FontAwesomeIcon icon={faHashtag} />}
              path={`/tags/${e.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}
