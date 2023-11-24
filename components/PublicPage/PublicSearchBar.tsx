import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

type Props = {
  placeHolder?: string;
};

export default function PublicSearchBar({ placeHolder }: Props) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    router.query.q
      ? setSearchQuery(decodeURIComponent(router.query.q as string))
      : setSearchQuery("");
  }, [router.query.q]);

  return (
    <div className="flex items-center relative group">
      <label
        htmlFor="search-box"
        className="inline-flex w-fit absolute left-2 pointer-events-none rounded-md text-primary"
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (!searchQuery) {
              return router.push("/public/collections/" + router.query.id);
            }

            return router.push(
              "/public/collections/" +
                router.query.id +
                "?q=" +
                encodeURIComponent(searchQuery || "")
            );
          }
        }}
        className="border text-sm border-neutral-content bg-gray-50 focus:border-sky-300 dark:focus:border-sky-600 rounded-md pl-8 py-2 pr-2 w-44 sm:w-60 dark:hover:border-neutral-600 md:focus:w-80 hover:border-sky-300 duration-100 outline-none dark:bg-neutral-800"
      />
    </div>
  );
}
