export const VERIFICATION_CODE_LENGTH = 6;

/**
 * Turns what a verification code field holds after an edit into the code.
 * Only digits are kept, so a code pasted with spaces, dashes or the text
 * around it still works. A paste or autofill that holds a whole code
 * replaces what was typed before it instead of being added after it.
 */
export function verificationCodeFromInput(previous: string, next: string) {
  const digits = next.replace(/\D/g, "");

  if (digits.length <= VERIFICATION_CODE_LENGTH) return digits;

  // What the edit added is what's left once the unchanged start and end of
  // the previous value are taken off
  let start = 0;
  while (start < previous.length && previous[start] === next[start]) start++;

  let end = 0;
  while (
    end < Math.min(previous.length, next.length) - start &&
    previous[previous.length - 1 - end] === next[next.length - 1 - end]
  )
    end++;

  const added = next.slice(start, next.length - end).replace(/\D/g, "");

  return (added.length >= VERIFICATION_CODE_LENGTH ? added : digits).slice(
    0,
    VERIFICATION_CODE_LENGTH
  );
}
