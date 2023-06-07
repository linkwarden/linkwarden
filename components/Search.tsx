import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Search() {
  const router = useRouter();

  const routeQuery = router.query.query;

  const [searchQuery, setSearchQuery] = useState(
    routeQuery ? decodeURIComponent(routeQuery as string) : ""
  );

  const [searchBox, setSearchBox] = useState(
    router.pathname.startsWith("/search") || false
  );

  return (
    <div
      className="flex items-center relative group"
      onClick={() => setSearchBox(true)}
    >
      <label
        htmlFor="search-box"
        className="inline-flex w-fit absolute left-2 pointer-events-none rounded-md p-1 text-sky-500 group-hover:text-sky-600"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
      </label>

      <input
        id="search-box"
        type="text"
        placeholder="Search for Links"
        value={searchQuery}
        onChange={(e) => {
          e.target.value.includes("%") &&
            console.log("The search query should not contain '%'.");
          setSearchQuery(e.target.value.replace("%", ""));
        }}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          router.push("/search/" + encodeURIComponent(searchQuery))
        }
        autoFocus={searchBox}
        className="border border-sky-100 rounded-md pl-10 py-2 pr-2 w-44 sm:w-60 focus:border-sky-500 md:focus:w-80 hover:border-sky-500 duration-100 outline-none"
      />
    </div>
  );
}
