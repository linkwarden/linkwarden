import { useState } from "react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Check } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { FormControl } from "./ui/Form.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover.tsx";
import { useListboxKeys } from "../../hooks/useListboxKeys.ts";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
};

export default function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const { activeIndex, listId, optionId, handleKeyDown } = useListboxKeys({
    options,
    onEnter: (option) => option && handleSelect(option),
    onClose: () => setOpen(false),
  });

  const selected = options.find((option) => option.value === value);

  return (
    <div className="min-w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              aria-haspopup="listbox"
              aria-expanded={open}
              className="w-full justify-between bg-neutral-100 dark:bg-neutral-900"
            >
              {selected?.label || placeholder}
              <CaretSortIcon
                aria-hidden
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
              />
            </Button>
          </FormControl>
        </PopoverTrigger>

        {open && (
          <PopoverContent
            className="w-[var(--radix-popper-anchor-width)] p-0"
            onKeyDown={handleKeyDown}
          >
            <div
              id={listId}
              role="listbox"
              className="w-full overflow-y-auto p-1 text-foreground"
            >
              {options.map((option, index) => (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option)}
                  className={`relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                >
                  {option.label}
                  {option.value === value && (
                    <Check aria-hidden className="ml-2 h-4 w-4 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
