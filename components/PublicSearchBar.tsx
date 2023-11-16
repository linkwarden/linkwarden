import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

type Props = {
  placeHolder?: string;
  className?: string;
};

export default function PublicSearchBar({ placeHolder, className }: Props) {
  const router = useRouter();

  const routeQuery = router.query.q;

  const [searchQuery, setSearchQuery] = useState(
    routeQuery ? decodeURIComponent(routeQuery as string) : ""
  );

  useEffect(() => {
    console.log(router);
  });

  return (
    <div className="flex items-center relative group">
      <label
        htmlFor="search-box"
        className="inline-flex w-fit absolute left-2 pointer-events-none rounded-md text-sky-500 dark:text-sky-500"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
      </label>

      <input
        id="search-box"
        type="text"
        placeholder={placeHolder}
        value={searchQuery}
        onChange={(e) => {
          e.target.value.includes("%") &&
            toast.error("The search query should not contain '%'.");
          setSearchQuery(e.target.value.replace("%", ""));
        }}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          router.push(
            "/public/collections/" +
              router.query.id +
              "?q=" +
              encodeURIComponent(searchQuery)
          )
        }
        className="border text-sm border-sky-100 bg-white dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600 rounded-md pl-7 py-1 pr-1 w-44 sm:w-60 dark:hover:border-neutral-600 md:focus:w-80 hover:border-sky-300 duration-100 outline-none dark:bg-neutral-800"
      />
    </div>
  );
}
