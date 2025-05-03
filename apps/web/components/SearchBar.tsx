import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";

type Props = {
  placeholder?: string;
};

export default function SearchBar({ placeholder }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    router.query.q
      ? setSearchQuery(decodeURIComponent(router.query.q as string))
      : setSearchQuery("");
  }, [router.query.q]);

  return (
    <div className="flex items-center relative group">
      <label
        htmlFor="search-box"
        className="inline-flex items-center w-fit absolute left-1 pointer-events-none rounded-md p-1 text-primary"
      >
        <i className="bi-search"></i>
      </label>

      <input
        id="search-box"
        type="text"
        placeholder={placeholder || t("search_for_links")}
        value={searchQuery}
        onChange={(e) => {
          e.target.value.includes("%") &&
            toast.error(t("search_query_invalid_symbol"));
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
        className="border border-neutral-content bg-base-200 focus:border-primary py-1 rounded-md pl-9 pr-2 w-full max-w-[15rem] md:focus:w-80 md:w-[15rem] md:max-w-full duration-200 outline-none"
      />
    </div>
  );
}
