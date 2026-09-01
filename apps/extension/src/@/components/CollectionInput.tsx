import { useMemo, useState } from "react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Search, X } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { FormControl } from "./ui/Form.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover.tsx";
import { Collection } from "../lib/actions/collections.ts";

type Props = {
  value?: { id?: number; ownerId?: number; name: string };
  onChange: (collection: {
    id?: number;
    ownerId?: number;
    name: string;
  }) => void;
  collections: Collection[] | undefined;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullScreen: boolean;
};

export default function CollectionInput({
  value,
  onChange,
  collections,
  isLoading,
  open,
  onOpenChange,
  fullScreen,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredCollections = useMemo(() => {
    if (!Array.isArray(collections)) return [];

    const query = search.trim().toLowerCase();
    if (!query) return collections;

    return collections.filter((collection) =>
      collection.name.toLowerCase().includes(query)
    );
  }, [search, collections]);

  const handleSelect = (collection: Collection) => {
    onChange({
      id: collection.id,
      ownerId: collection.ownerId,
      name: collection.name,
    });

    onOpenChange(false);
  };

  const list = (
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground ${
        fullScreen ? "rounded-none" : "rounded-md"
      }`}
    >
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className="flex h-11 w-full min-w-[280px] bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search Collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          // Without this, Enter submits the form this input is nested in.
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
      </div>

      {isLoading ? (
        <p className="w-full text-center my-auto">Loading...</p>
      ) : filteredCollections.length === 0 ? (
        <p className="py-6 text-center text-sm">No Collection found.</p>
      ) : (
        <div className="w-full overflow-hidden p-1 text-foreground">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              onClick={() => handleSelect(collection)}
              className="relative flex cursor-pointer select-none flex-col items-start justify-start rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <p>{collection.name}</p>
              <p className="text-xs text-neutral-500">{collection.pathname}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-w-full">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-neutral-100 dark:bg-neutral-900"
            >
              {isLoading
                ? "Unorganized"
                : value?.name || "Select a collection..."}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>

        {open &&
          (fullScreen ? (
            <div className="fade-up fixed inset-0 z-50 h-full w-full overflow-y-auto bg-white">
              <Button
                type="button"
                className="absolute top-1 right-1 bg-transparent hover:bg-transparent hover:opacity-50 transition-colors ease-in-out duration-200"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4 text-black dark:text-white" />
              </Button>
              {list}
            </div>
          ) : (
            <PopoverContent className="min-w-full p-0 overflow-y-auto max-h-[200px]">
              {list}
            </PopoverContent>
          ))}
      </Popover>
    </div>
  );
}
