import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import TextInput from "./TextInput";
import { useCollections } from "@linkwarden/router/collections";

export default function DashboardViewDropdown() {
  const { t } = useTranslation();
  const { data: collections = [], isLoading } = useCollections();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredCollections = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return collections;
    }

    return collections.filter((collection) =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collections, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="bi-sliders2-vertical text-neutral"></i>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-72 py-2" align="end">
        <div className="px-1 flex flex-col gap-1">
          <p className="text-sm text-neutral">{t("display_on_dashboard")}</p>
          <TextInput
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="py-0"
            placeholder={t("search")}
          />
          <ul className="max-h-60 overflow-y-auto">
            {!isLoading &&
              filteredCollections.length > 0 &&
              filteredCollections.map((collection) => (
                <li
                  key={collection.id}
                  className="py-1 px-2 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="checkbox checkbox-primary"
                      type="checkbox"
                      checked={false}
                      onChange={() => {
                        /* Handle checkbox change */
                      }}
                    />
                    <label
                      htmlFor={`collection-${collection.id}`}
                      className="text-sm"
                    >
                      {collection.name}
                    </label>
                  </div>

                  <i className="bi-grip-vertical text-neutral"></i>
                </li>
              ))}
            {!isLoading && filteredCollections.length === 0 && searchTerm && (
              <li className="py-2 px-2 text-sm text-neutral text-center">
                {t("you_have_no_collections")}
              </li>
            )}
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
