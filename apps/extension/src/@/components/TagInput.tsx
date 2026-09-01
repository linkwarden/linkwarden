import { UIEvent, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover.tsx";
import { ResponseTags } from "../lib/actions/tags.ts";

type Props = {
  value: { name: string; id?: number }[];
  onChange: (tags: { name: string }[]) => void;
  tags: Pick<ResponseTags, "id" | "name">[] | undefined;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onReachEnd?: () => void;
  onSearchChange?: (value: string) => void;
};

export default function TagInput({
  value,
  onChange,
  tags,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
  onSearchChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTags = useMemo(() => {
    if (!Array.isArray(tags)) return [];

    const query = search.trim().toLowerCase();
    if (!query) return tags;

    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [search, tags]);

  const handleToggleTag = (tag: { name: string }) => {
    if (value.some((v) => v.name === tag.name)) {
      onChange(value.filter((v) => v.name !== tag.name));
    } else {
      onChange([...value, tag]);
    }

    setOpen(false);
  };

  // Enter turns whatever is typed in the search box into a brand new tag.
  const handleAddSearchAsTag = () => {
    if (!search || value.some((v) => v.name === search)) return;

    onChange([...value, { name: search }]);
    setSearch("");
    onSearchChange?.("");
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage || !onReachEnd) return;

    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

    if (scrollTop + clientHeight >= scrollHeight - 16) onReachEnd();
  };

  return (
    <div className="min-w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-neutral-100 dark:bg-neutral-900"
          >
            {value.length > 0
              ? value.map((tag) => tag.name).join(", ")
              : "Select tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="min-w-full p-0">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full min-w-[280px] bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search tag or add tag (Enter)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSearchAsTag();
                }}
              />
            </div>

            <div
              className="max-h-[200px] overflow-y-auto overflow-x-hidden"
              onScroll={handleScroll}
            >
              {filteredTags.length === 0 && !isFetchingNextPage ? (
                <p className="py-6 text-center text-sm">No tag found.</p>
              ) : (
                <div className="w-full overflow-hidden p-1 text-foreground">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.name}
                      onClick={() => handleToggleTag(tag)}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value.some((v) => v.name === tag.name)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {tag.name}
                    </div>
                  ))}

                  {isFetchingNextPage && (
                    <div className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                      Loading more tags...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
