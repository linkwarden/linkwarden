import { KeyboardEvent, useEffect, useId, useState } from "react";

type Props<T> = {
  options: T[];
  onEnter: (option: T | null) => void;
  onClose: () => void;
};

export function useListboxKeys<T>({ options, onEnter, onClose }: Props<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listId = useId();

  const optionId = (index: number) => `${listId}-${index}`;

  useEffect(() => setActiveIndex(null), [options]);

  useEffect(() => {
    if (activeIndex === null) return;

    document
      .getElementById(`${listId}-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();

      if (!options.length) return;

      const step = e.key === "ArrowDown" ? 1 : -1;

      setActiveIndex((index) =>
        index === null
          ? step === 1
            ? 0
            : options.length - 1
          : (index + step + options.length) % options.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter(activeIndex === null ? null : options[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return { activeIndex, listId, optionId, handleKeyDown };
}
