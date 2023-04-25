// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Collection } from "@prisma/client";
import Link from "next/link";

export default function ({ collection }: { collection: Collection }) {
  const formattedDate = new Date(collection.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="p-5 bg-gray-100 h-40 w-60 rounded-md border-sky-100 border-solid border flex flex-col justify-between cursor-pointer hover:bg-gray-50 duration-100">
        <div>
          <div className="flex justify-between text-sky-900 items-center">
            <p className="text-lg w-max">{collection.name}</p>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="w-3 h-3 text-gray-500"
            />
          </div>
          <p className="text-sm font-bold text-gray-500">
            {collection.description}
          </p>
        </div>
        <p className="text-sm text-sky-300 font-bold">{formattedDate}</p>
      </div>
    </Link>
  );
}
