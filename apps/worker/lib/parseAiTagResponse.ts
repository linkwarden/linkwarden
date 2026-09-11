/**
 * Extracts the tag array out of an AI response.
 *
 * Models don't always follow the "output ONLY a JSON array" instruction, so on
 * top of a bare array we also accept a fenced code block and an array wrapped
 * in prose. Returns null when the response holds no usable array, so the caller
 * can treat it as a failure instead of silently dropping the link.
 */
export default function parseAiTagResponse(text: string): string[] | null {
  if (!text) return null;

  const candidates = [
    text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1],
    text,
    text.match(/\[[\s\S]*\]/)?.[0],
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }

    if (!Array.isArray(parsed)) continue;

    return parsed
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return null;
}
