import { useCallback, useState } from "react";
import { Sort } from "@linkwarden/types/global";

// Written only when the reader picks a sort, so someone who never has keeps
// getting the default.
const STORAGE_KEY = "linkSort";

// Where the sort used to be kept. Every list wrote it as soon as it opened, so a
// stored newest first is only the old default, while any other value was picked.
const LEGACY_STORAGE_KEY = "sortBy";

const readSort = (): Sort => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null && Number(saved) in Sort) return Number(saved);

  const legacy = Number(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacy !== Sort.DateNewestFirst && legacy in Sort) return legacy;

  return Sort.Custom;
};

/**
 * The sort a list of links is shown in, shared by every list.
 *
 * Until the reader picks one it's the custom order. That only exists inside a
 * single collection, so on any other list (`allowCustomOrder` false) it shows as
 * newest first, without changing what's saved.
 */
export default function useLinkSort(allowCustomOrder = false) {
  const [saved, setSaved] = useState(readSort);

  const sortBy =
    saved === Sort.Custom && !allowCustomOrder ? Sort.DateNewestFirst : saved;

  const setSortBy = useCallback((sort: Sort) => {
    localStorage.setItem(STORAGE_KEY, sort.toString());
    setSaved(sort);
  }, []);

  return [sortBy, setSortBy] as const;
}
