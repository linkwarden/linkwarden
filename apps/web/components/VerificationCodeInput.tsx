import { cn } from "@linkwarden/lib/utils";
import {
  VERIFICATION_CODE_LENGTH,
  verificationCodeFromInput,
} from "@linkwarden/lib/verificationCode";
import React, { useEffect, useRef, useState } from "react";

type Props = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "value" | "onChange" | "type"
> & {
  value: string;
  onChange: (code: string) => void;
};

// One regular input lies over the boxes and holds the whole code, so typing,
// pasting, autofill, password managers and screen readers work like they do
// on any text field. The boxes only show what's in it.
export default function VerificationCodeInput({
  value,
  onChange,
  className,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // The input's text is hidden, so a click would put the caret at some spot
  // the boxes don't show. The caret stays at the end, where the next digit
  // goes, while selections (like select all) are kept.
  function syncSelection() {
    const input = inputRef.current;
    if (!input || document.activeElement !== input) return;

    const length = input.value.length;
    let start = input.selectionStart ?? length;
    let end = input.selectionEnd ?? length;

    if (start === end && start !== length) {
      input.setSelectionRange(length, length);
      start = end = length;
    }

    setSelection({ start, end });
  }

  // React's onSelect misses selections made from the iOS edit menu (Select
  // All), so the native events are watched too
  useEffect(() => {
    const input = inputRef.current;

    document.addEventListener("selectionchange", syncSelection);
    input?.addEventListener("select", syncSelection);

    return () => {
      document.removeEventListener("selectionchange", syncSelection);
      input?.removeEventListener("select", syncSelection);
    };
  }, []);

  const hasSelection =
    selection.start < selection.end && selection.end <= value.length;
  const caretIndex = Math.min(value.length, VERIFICATION_CODE_LENGTH - 1);

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="flex gap-2">
        {Array.from({ length: VERIFICATION_CODE_LENGTH }, (_, index) => {
          const active =
            focused &&
            (hasSelection
              ? index >= selection.start && index < selection.end
              : index === caretIndex);

          return (
            // The active border is 1px thicker, so it takes the place of 1px
            // of padding and the boxes and digits don't move
            <div
              key={index}
              className={cn(
                "flex flex-1 aspect-square items-center justify-center rounded-xl border border-neutral-content bg-base-100 p-px text-2xl font-semibold transition-colors duration-100",
                active && "border-2 border-primary bg-primary/10 p-0"
              )}
            >
              {value[index] ??
                (active && !hasSelection && (
                  <div className="h-7 w-0.5 bg-base-content animate-caret-blink" />
                ))}
            </div>
          );
        })}
      </div>

      <input
        {...rest}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        spellCheck={false}
        value={value}
        onChange={(e) =>
          onChange(verificationCodeFromInput(value, e.target.value))
        }
        onSelect={syncSelection}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        // 16px text keeps iOS from zooming in, and the squeezed letters put
        // the caret at the end wherever the boxes are clicked
        className="absolute inset-0 h-full w-full cursor-text border-0 bg-transparent p-0 font-mono text-base tracking-[-0.5em] text-transparent caret-transparent outline-none selection:bg-transparent placeholder:text-transparent autofill:opacity-0"
      />
    </div>
  );
}
