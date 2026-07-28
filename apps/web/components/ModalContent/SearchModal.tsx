import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import Modal from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ADVANCED_SEARCH_OPERATORS } from "@/components/SearchBar";

export const isAppleDevice =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 5;

type RecentSearch = {
  query: string;
  searchedAt: string;
};

const getRecentSearches = (): RecentSearch[] => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"
    );
    if (!Array.isArray(stored)) return [];
    return stored.filter((entry) => typeof entry?.query === "string");
  } catch {
    return [];
  }
};

const setRecentSearches = (recents: RecentSearch[]) => {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recents));
};

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recents, setRecents] = useState<RecentSearch[]>(getRecentSearches);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const submit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const updated = [
      { query: trimmed, searchedAt: new Date().toISOString() },
      ...recents.filter((entry) => entry.query !== trimmed),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);

    router.push("/search?q=" + encodeURIComponent(trimmed));
    onClose();
  };

  const removeRecent = (query: string) => {
    const updated = recents.filter((entry) => entry.query !== query);
    setRecentSearches(updated);
    setRecents(updated);
  };

  const appendOperator = (operator: string) => {
    setSearchQuery((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(" ");
      return `${prev}${needsSpace ? " " : ""}${operator}`;
    });
    inputRef.current?.focus();
  };

  return (
    <Modal toggleModal={onClose} hideCloseButton>
      <div className="flex items-center gap-3">
        <i className="bi-search text-neutral text-lg leading-none" />
        <input
          type="text"
          ref={inputRef}
          autoFocus
          placeholder={t("search_for_links")}
          value={searchQuery}
          onChange={(e) => {
            e.target.value.includes("%") &&
              toast.error(t("search_query_invalid_symbol"));
            setSearchQuery(e.target.value.replace("%", ""));
          }}
          onKeyDown={(e) => e.key === "Enter" && submit(searchQuery)}
          className="w-full bg-transparent outline-none text-lg"
        />
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Kbd>{isAppleDevice ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </div>
      </div>

      <div className="border-t border-neutral-content -mx-4 sm:-mx-5 mt-4" />

      <div className="sm:max-h-80 sm:overflow-y-auto -mx-4 sm:-mx-5 -mb-4 sm:-mb-5">
        {recents.length > 0 && (
          <div className="px-4 sm:px-5">
            <p className="text-xs font-bold text-neutral mt-4">{t("recent")}</p>
            <div className="flex flex-col gap-1 mt-2">
              {recents.map((entry) => (
                <div
                  key={entry.query}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-base-200 duration-100"
                  onClick={() => submit(entry.query)}
                >
                  <i className="bi-clock-history text-neutral" />
                  <span className="flex-1 truncate text-sm">{entry.query}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={t("delete")}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecent(entry.query);
                    }}
                  >
                    <i className="bi-x text-lg text-neutral" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-content -mx-4 sm:-mx-5 mt-4" />
          </div>
        )}

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <p className="text-xs font-bold text-neutral mt-4">
            {t("suggested_search_operators")}
          </p>
          <div className="flex flex-col gap-1 mt-2">
            {ADVANCED_SEARCH_OPERATORS.map((entry) => (
              <button
                key={entry.operator}
                type="button"
                className="flex items-center gap-2 justify-between rounded-md px-2 py-1.5 text-left hover:bg-base-200 duration-100"
                onClick={() => appendOperator(entry.operator)}
              >
                <div className="flex items-center gap-3">
                  <i className={`${entry.icon} text-primary`} />
                  <span className="text-sm">{t(entry.labelKey)}</span>
                </div>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-base-200 border border-neutral-content text-base-content">
                  {entry.operator}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-2">
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link
                href="https://docs.linkwarden.app/Usage/advanced-search"
                target="_blank"
                className="flex items-center gap-1"
              >
                {t("learn_more")}
                <i className="bi-box-arrow-up-right text-xs" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
