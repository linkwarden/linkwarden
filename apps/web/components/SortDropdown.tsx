import React, { Dispatch, SetStateAction, useEffect } from "react";
import { Sort } from "@linkwarden/types/global";
import { TFunction } from "i18next";
import useLocalSettingsStore from "@/store/localSettings";
import { resetInfiniteQueryPagination } from "@linkwarden/router/lib";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

type Props = {
  sortBy: Sort;
  setSort: Dispatch<SetStateAction<Sort>>;
  t: TFunction<"translation", undefined>;
  /**
   * Whether the list being sorted is a single collection, which is the only place a
   * hand-made order means anything.
   */
  allowCustomOrder?: boolean;
};

export default function SortDropdown({
  sortBy,
  setSort,
  t,
  allowCustomOrder,
}: Props) {
  const { updateSettings } = useLocalSettingsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    updateSettings({ sortBy });
  }, [sortBy]);

  // The chosen sort is remembered across the whole app, so arriving on a list that
  // can't be hand-ordered with "Custom Order" still selected would leave the menu
  // showing an option that isn't there. Fall back to the default instead.
  useEffect(() => {
    if (sortBy === Sort.Custom && !allowCustomOrder) {
      setSort(Sort.DateNewestFirst);
    }
  }, [sortBy, allowCustomOrder]);

  const handleValueChange = (value: string) => {
    resetInfiniteQueryPagination(queryClient, ["links"]);
    // The radio group hands back a string. It has to become a number again here, or
    // the state typed as Sort holds "4" and every `sortBy === Sort.X` comparison a
    // page makes is false until the next reload reads it back out of localStorage.
    setSort(Number(value) as Sort);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="bi-chevron-expand text-neutral text-xl"></i>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={4} align="end">
        <DropdownMenuRadioGroup
          value={sortBy.toString()}
          onValueChange={handleValueChange}
        >
          <DropdownMenuRadioItem value={Sort.DateNewestFirst.toString()}>
            {t("date_newest_first")}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value={Sort.DateOldestFirst.toString()}>
            {t("date_oldest_first")}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value={Sort.NameAZ.toString()}>
            {t("name_az")}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value={Sort.NameZA.toString()}>
            {t("name_za")}
          </DropdownMenuRadioItem>

          {allowCustomOrder && (
            <DropdownMenuRadioItem value={Sort.Custom.toString()}>
              {t("custom_order")}
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
