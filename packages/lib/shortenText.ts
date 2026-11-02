// Cuts text to at most `length` UTF-16 units, like .slice(0, length), but never
// through a character made of two units, which most emoji are. Half of one isn't
// valid text and the database refuses it, so a character the cut would split is
// left out whole. Nothing in, nothing out.
export function shortenText(text: string, length: number): string;
export function shortenText(
  text: string | null | undefined,
  length: number
): string | undefined;
export function shortenText(text: string | null | undefined, length: number) {
  if (text == null) return undefined;

  const cut = text.slice(0, length);
  const last = cut.charCodeAt(cut.length - 1);

  // The first half of a pair, whose second half was cut off
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

export default shortenText;
