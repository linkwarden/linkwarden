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
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import SidebarItem from "./SidebarItem";
import useTagStore from "@/store/tags";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function () {
  const { collections } = useCollectionStore();
  const { tags } = useTagStore();

  const router = useRouter();

  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.asPath);
  }, [router]);

  return (
    <div className="bg-gray-100 h-screen w-64 xl:w-80 p-2 overflow-y-auto border-solid border-r-sky-100 border z-20">
      <p className="p-2 text-sky-500 font-bold text-xl mb-5 leading-4">
        Linkwarden
      </p>

      <Link href="/dashboard">
        <div
          className={`${
            active === "/dashboard"
              ? "bg-sky-500"
              : "hover:bg-gray-50 hover:outline bg-gray-100"
          } outline-sky-100 outline-1 duration-100 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2`}
        >
          <FontAwesomeIcon
            icon={faChartSimple}
            className={`w-4 ${
              active === "/dashboard" ? "text-white" : "text-sky-300"
            }`}
          />
          <p
            className={`${
              active === "/dashboard" ? "text-white" : "text-sky-900"
            }`}
          >
            Dashboard
          </p>
        </div>
      </Link>

      <Link href="/links">
        <div
          className={`${
            active === "/links"
              ? "bg-sky-500"
              : "hover:bg-gray-50 hover:outline bg-gray-100"
          } outline-sky-100 outline-1 duration-100 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2`}
        >
          <FontAwesomeIcon
            icon={faBookmark}
            className={`w-4 ${
              active === "/links" ? "text-white" : "text-sky-300"
            }`}
          />
          <p
            className={`${active === "/links" ? "text-white" : "text-sky-900"}`}
          >
            All Links
          </p>
        </div>
      </Link>

      <Link href="/collections">
        <div
          className={`${
            active === "/collections"
              ? "bg-sky-500"
              : "hover:bg-gray-50 hover:outline bg-gray-100"
          } outline-sky-100 outline-1 duration-100 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2`}
        >
          <FontAwesomeIcon
            icon={faBox}
            className={`w-4 ${
              active === "/collections" ? "text-white" : "text-sky-300"
            }`}
          />
          <p
            className={`${
              active === "/collections" ? "text-white" : "text-sky-900"
            }`}
          >
            All Collections
          </p>
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
