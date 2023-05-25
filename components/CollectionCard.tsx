// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { ExtendedCollection } from "@/types/global";
import useLinkStore from "@/store/links";

export default function ({ collection }: { collection: ExtendedCollection }) {
  const { links } = useLinkStore();
  const formattedDate = new Date(collection.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="p-5 bg-gray-100 min-h-[12rem] rounded-md border-sky-100 border-solid border flex flex-col gap-2 justify-between cursor-pointer hover:bg-gray-50 duration-100">
        <div>
          <div className="flex justify-between text-sky-600 items-center">
            <p className="text-lg w-max font-bold">{collection.name}</p>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="w-3 h-3 text-gray-500"
            />
          </div>
          <p className="text-sky-400">{collection.description}</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sky-400 flex items-center w-full">
            {collection.members
              .map((e, i) => {
                return (
                  <img
                    src={`/api/avatar/${e.userId}`}
                    className="h-10 w-10 shadow rounded-full border-[3px] border-sky-100 -mr-3"
                    alt=""
                  />
                );
              })
              .reverse()
              .slice(0, 3)}
            {collection.members.length - 3 > 0 ? (
              <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-500 border-sky-100 -mr-3">
                +{collection.members.length - 3}
              </div>
            ) : null}
          </div>
          <div className="text-right w-full">
            <p className="text-sky-500 font-bold">
              {links.filter((e) => e.collectionId === collection.id).length}{" "}
              Links
            </p>
            <p className="text-sky-300 font-bold text-sm">{formattedDate}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
