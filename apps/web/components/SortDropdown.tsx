import React, { Dispatch, SetStateAction, useEffect } from "react";
import { Sort } from "@linkwarden/types";
import { TFunction } from "i18next";
import useLocalSettingsStore from "@/store/localSettings";
import { resetInfiniteQueryPagination } from "@linkwarden/router/links";
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
};

export default function SortDropdown({ sortBy, setSort, t }: Props) {
  const { updateSettings } = useLocalSettingsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    updateSettings({ sortBy });
  }, [sortBy]);

  const handleValueChange = (value: string) => {
    resetInfiniteQueryPagination(queryClient, ["links"]);
    setSort(value as unknown as Sort);
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
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
