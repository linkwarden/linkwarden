import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

type Props = {
  placeholder?: string;
};

export default function SearchBar({ placeholder }: Props) {
  const router = useRouter();

  const routeQuery = router.query.q;

  const [searchQuery, setSearchQuery] = useState(
    routeQuery ? decodeURIComponent(routeQuery as string) : ""
  );

  return (
    <div className="flex items-center relative group">
      <label
        htmlFor="search-box"
        className="inline-flex w-fit absolute left-1 pointer-events-none rounded-md p-1 text-primary"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
      </label>

      <input
        id="search-box"
        type="text"
        placeholder={placeholder || "Search for Links"}
        value={searchQuery}
        onChange={(e) => {
          e.target.value.includes("%") &&
            toast.error("The search query should not contain '%'.");
          setSearchQuery(e.target.value.replace("%", ""));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (router.pathname.startsWith("/public")) {
              if (!searchQuery) {
                return router.push("/public/collections/" + router.query.id);
              }

              return router.push(
                "/public/collections/" +
                  router.query.id +
                  "?q=" +
                  encodeURIComponent(searchQuery || "")
              );
            } else {
              return router.push(
                "/search?q=" + encodeURIComponent(searchQuery)
              );
            }
          }
        }}
        className="border border-neutral-content bg-base-200 focus:border-primary py-1 rounded-md pl-9 pr-2 w-44 sm:w-60 md:focus:w-80 duration-100 outline-none"
      />
    </div>
  );
}
