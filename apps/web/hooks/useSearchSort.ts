import { useCallback, useState } from "react";
import { Sort } from "@linkwarden/types/global";

// Kept apart from the sort the other lists share, since best match only exists here
const STORAGE_KEY = "searchSort";

const SEARCH_SORTS = [
  Sort.BestMatch,
  Sort.DateNewestFirst,
  Sort.DateOldestFirst,
  Sort.NameAZ,
  Sort.NameZA,
];

const readSort = (): Sort => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && /^\d+$/.test(saved) && SEARCH_SORTS.includes(Number(saved)))
    return Number(saved);

  return Sort.BestMatch;
};

/**
 * The sort search results are shown in. Best match until the reader picks another.
 */
export default function useSearchSort() {
  const [sortBy, setSaved] = useState(readSort);

  const setSortBy = useCallback((sort: Sort) => {
    localStorage.setItem(STORAGE_KEY, sort.toString());
    setSaved(sort);
  }, []);

  return [sortBy, setSortBy] as const;
}
