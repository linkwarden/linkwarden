import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

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
        className="inline-flex w-fit absolute left-2 pointer-events-none rounded-md p-1 text-sky-500 dark:text-sky-500"
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
            toast.error("The search query should not contain '%'.");
          setSearchQuery(e.target.value.replace("%", ""));
        }}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          router.push("/search?q=" + encodeURIComponent(searchQuery))
        }
        autoFocus={searchBox}
        className="border border-sky-100 bg-gray-50 dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600 rounded-md pl-10 py-2 pr-2 w-44 sm:w-60 dark:hover:border-neutral-600 md:focus:w-80 hover:border-sky-300 duration-100 outline-none dark:bg-neutral-800"
      />
    </div>
  );
}
