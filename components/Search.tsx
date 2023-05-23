// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import useSearchSettingsStore from "@/store/search";
import { useRouter } from "next/router";

export default function Search() {
  const router = useRouter();

  const [searchBox, setSearchBox] = useState(
    false || router.pathname == "/search"
  );

  const { searchSettings, setSearchSettings, setSearchQuery } =
    useSearchSettingsStore();

  useEffect(() => {
    if (router.pathname !== "/search")
      setSearchSettings({
        query: "",
        filter: {
          name: true,
          url: true,
          title: true,
          collection: true,
          tags: true,
        },
      });
  }, [router]);

  return (
    <div
      className="flex items-center relative group"
      onClick={() => setSearchBox(true)}
    >
      <label
        htmlFor="search-box"
        className="inline-flex w-fit absolute right-2 pointer-events-none rounded-md p-1 text-sky-500 group-hover:text-sky-600"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
      </label>

      <input
        id="search-box"
        type="text"
        placeholder="Search for Links"
        value={searchSettings.query}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          router.push("/search");
        }}
        autoFocus={searchBox}
        className="border border-sky-100 rounded-md pr-10 w-44 sm:w-60 focus:border-sky-500 sm:focus:w-80 hover:border-sky-500 duration-100 outline-none p-2"
      />
    </div>
  );
}
