import { describe, expect, it } from "vitest";
import parseAiTagResponse from "./parseAiTagResponse";

describe("parseAiTagResponse", () => {
  it("parses a bare JSON array", () => {
    expect(parseAiTagResponse('["Machine Learning", "Python"]')).toEqual([
      "Machine Learning",
      "Python",
    ]);
  });

  it("parses an array inside a fenced code block", () => {
    expect(
      parseAiTagResponse('```json\n["Web Development", "CSS"]\n```')
    ).toEqual(["Web Development", "CSS"]);
  });

  it("parses an array wrapped in prose", () => {
    expect(
      parseAiTagResponse(
        'Sure! Here are the tags for this page: ["API", "AWS"]. Let me know if you want more.'
      )
    ).toEqual(["API", "AWS"]);
  });

  it("drops entries that aren't usable tags", () => {
    expect(parseAiTagResponse('["Python", 42, "  ", null, " AI "]')).toEqual([
      "Python",
      "AI",
    ]);
  });

  it("returns an empty array when the model found no tags", () => {
    expect(parseAiTagResponse("[]")).toEqual([]);
  });

  it("parses an array the model nested in an object", () => {
    expect(parseAiTagResponse('{"tags": ["Python"]}')).toEqual(["Python"]);
  });

  it("returns null when the response has no array", () => {
    expect(parseAiTagResponse("")).toBeNull();
    expect(parseAiTagResponse("I couldn't find any relevant tags.")).toBeNull();
  });

  it("returns null when the array is broken", () => {
    expect(parseAiTagResponse('["Python", "AI"')).toBeNull();
    expect(parseAiTagResponse("```json\n[Python, AI]\n```")).toBeNull();
  });
});
