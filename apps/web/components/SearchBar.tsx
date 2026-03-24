import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import { useUser } from "@linkwarden/router/user";

type Props = {
  placeholder?: string;
};

const ADVANCED_SEARCH_OPERATORS = [
  {
    operator: "url:",
    labelKey: "url",
    icon: "bi-link-45deg",
  },
  {
    operator: "tag:",
    labelKey: "tag",
    icon: "bi-tag",
  },
  {
    operator: "before:",
    labelKey: "before",
    icon: "bi-calendar-minus",
  },
  {
    operator: "after:",
    labelKey: "after",
    icon: "bi-calendar-plus",
  },
  {
    operator: "pinned:true",
    labelKey: "pinned",
    icon: "bi-pin-angle",
  },
] as const;

export default function SearchBar({ placeholder }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: user } = useUser();

  const [dismissSearchNote, setDismissSearchNote] = useState(false);

  useEffect(() => {
    router.query.q
      ? setSearchQuery(decodeURIComponent(router.query.q as string))
      : setSearchQuery("");
  }, [router.query.q]);

  const handleSuggestionClick = (operator: string) => {
    setSearchQuery((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(" ");
      return `${prev}${needsSpace ? " " : ""}${operator}`;
    });
    setShowSuggestions(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

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
        ref={inputRef}
        placeholder={placeholder || t("search_for_links")}
        value={searchQuery}
        onFocus={() => {
          setShowSuggestions(true);
        }}
        onBlur={() => {
          setShowSuggestions(false);
        }}
        onChange={(e) => {
          e.target.value.includes("%") &&
            toast.error(t("search_query_invalid_symbol"));
          setSearchQuery(e.target.value.replace("%", ""));
          setShowSuggestions(false);
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
        className="border border-neutral-content bg-base-200 focus:border-primary py-1 rounded-md pl-9 pr-2 w-full max-w-[15rem] md:w-80 md:max-w-full outline-none"
      />

      {showSuggestions && (
        <div className="absolute left-0 top-full mt-2 w-full z-50">
          <div
            className="border border-neutral-content bg-base-200 shadow-md rounded-md px-2 py-1 flex flex-col gap-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-neutral">
                {t("suggested_search_operators")}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {ADVANCED_SEARCH_OPERATORS.map((entry) => (
                <button
                  key={entry.operator}
                  type="button"
                  className="flex items-center gap-2 justify-between rounded-md px-2 py-1 text-left hover:bg-neutral-content duration-100"
                  onClick={() => handleSuggestionClick(entry.operator)}
                >
                  <div className="flex items-center gap-2">
                    <i className={`${entry.icon} text-primary text-sm`} />
                    <span className="text-xs text-neutral">
                      {t(entry.labelKey)}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-1 rounded-md bg-base-100 border border-neutral-content text-base-content">
                    {entry.operator}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link
                  href="https://docs.linkwarden.app/Usage/advanced-search"
                  target="_blank"
                  className="flex items-center gap-1 w-full"
                >
                  {t("learn_more")}
                  <i className="bi-box-arrow-up-right text-xs" />
                </Link>
              </Button>
            </div>

            {/* {user?.hasUnIndexedLinks && !dismissSearchNote ? (
              <div
                role="alert"
                className="border border-neutral p-2 my-1 rounded flex flex-col gap-2"
              >
                <p className="text-xs text-neutral">
                  <i className="bi-info-circle text-primary mr-1" />
                  <b>{t("note")}:</b> {t("search_unindexed_links_in_bg_info")}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDismissSearchNote(true)}
                >
                  Dismiss
                </Button>
              </div>
            ) : undefined} */}
          </div>
        </div>
      )}
    </div>
  );
}
