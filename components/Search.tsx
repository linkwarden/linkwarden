import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import useSearchSettingsStore from "@/store/search";
import { useRouter } from "next/router";

export default function Search() {
  const router = useRouter();

  const [searchBox, setSearchBox] = useState(
    false || router.pathname == "/search"
  );

  const { searchSettings, toggleCheckbox, setSearchQuery } =
    useSearchSettingsStore();

  return (
    <ClickAwayHandler onClickOutside={() => setSearchBox(false)}>
      <div
        className="flex items-center relative"
        onClick={() => setSearchBox(true)}
      >
        <label
          htmlFor="search-box"
          className="inline-flex w-fit absolute right-0 pointer-events-none rounded-md p-1 text-sky-500"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
        </label>

        <input
          id="search-box"
          type="text"
          placeholder="Search for Links"
          value={searchSettings.query}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => router.push("/search")}
          autoFocus={searchBox}
          className="border border-sky-100 rounded-md pr-6 w-60 focus:border-sky-500 sm:focus:w-80 hover:border-sky-500 duration-100 outline-none p-1"
        />
        {searchBox ? (
          <div className="absolute flex flex-wrap items-baseline justify-between gap-2 top-9 left-0 shadow-md bg-gray-50 rounded-md p-2 z-10 border border-sky-100 w-60 sm:w-80">
            <p className="text-sky-900">Filter by:</p>
            <div className="flex gap-1 text-sm font-bold flex-wrap text-sky-500">
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchSettings.filter.name}
                  onChange={() => toggleCheckbox("name")}
                  className="peer sr-only"
                />
                <span className="text-sky-900 peer-checked:bg-sky-500 text-xs hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                  Name
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchSettings.filter.url}
                  onChange={() => toggleCheckbox("url")}
                  className="peer sr-only"
                />
                <span className="text-sky-900 peer-checked:bg-sky-500 text-xs hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                  Link
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchSettings.filter.title}
                  onChange={() => toggleCheckbox("title")}
                  className="peer sr-only"
                />
                <span className="text-sky-900 peer-checked:bg-sky-500 text-xs hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                  Title
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchSettings.filter.collection}
                  onChange={() => toggleCheckbox("collection")}
                  className="peer sr-only"
                />
                <span className="text-sky-900 peer-checked:bg-sky-500 text-xs hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                  Collection
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchSettings.filter.tags}
                  onChange={() => toggleCheckbox("tags")}
                  className="peer sr-only"
                />
                <span className="text-sky-900 peer-checked:bg-sky-500 text-xs hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                  Tags
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </ClickAwayHandler>
  );
}
