import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import ClickAwayHandler from "./ClickAwayHandler";
import useSearchSettingsStore from "@/store/search";
import { useRouter } from "next/router";
import Checkbox from "./Checkbox";

export default function Search() {
  const router = useRouter();

  const [searchBox, setSearchBox] = useState(
    false || router.pathname == "/search"
  );

  const { searchSettings, toggleCheckbox, setSearchQuery } =
    useSearchSettingsStore();

  useEffect(() => {
    if (router.pathname !== "/search") setSearchQuery("");
  }, [router]);

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
          <div className="absolute top-9 left-0 shadow-md bg-gray-50 rounded-md p-2 z-20 border border-sky-100 w-60 sm:w-80">
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 w-fit mx-auto">
              <p className="text-sky-900 font-semibold">Filter by</p>
              <Checkbox
                label="Name"
                state={searchSettings.filter.name}
                onClick={() => toggleCheckbox("name")}
              />
              <Checkbox
                label="Link"
                state={searchSettings.filter.url}
                onClick={() => toggleCheckbox("url")}
              />
              <Checkbox
                label="Title"
                state={searchSettings.filter.title}
                onClick={() => toggleCheckbox("title")}
              />
              <Checkbox
                label="Collection"
                state={searchSettings.filter.collection}
                onClick={() => toggleCheckbox("collection")}
              />
              <Checkbox
                label="Tags"
                state={searchSettings.filter.tags}
                onClick={() => toggleCheckbox("tags")}
              />
            </div>
          </div>
        ) : null}
      </div>
    </ClickAwayHandler>
  );
}
