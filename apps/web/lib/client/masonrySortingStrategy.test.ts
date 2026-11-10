import { describe, expect, it } from "vitest";
import { masonryLayoutAfterMove } from "./masonrySortingStrategy";

// Three columns 100 apart, a 10px gap, as react-masonry-css lays them out: card `i`
// goes to column `i % 3` and each column stacks top to bottom.
const evenColumns = [
  { left: 0, top: 0, height: 50 },
  { left: 100, top: 0, height: 50 },
  { left: 200, top: 0, height: 50 },
  { left: 0, top: 60, height: 50 },
  { left: 100, top: 60, height: 50 },
  { left: 200, top: 60, height: 50 },
];

describe("masonryLayoutAfterMove", () => {
  it("shuffles every card along when one moves to the front", () => {
    expect(masonryLayoutAfterMove(evenColumns, 5, 0)).toEqual([
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 0, y: 60 },
      { x: 100, y: 60 },
      { x: 200, y: 60 },
      { x: 0, y: 0 },
    ]);
  });

  it("leaves everything where it is when the card does not move", () => {
    const places = masonryLayoutAfterMove(evenColumns, 2, 2);

    expect(places).toEqual(
      evenColumns.map((box) => ({ x: box.left, y: box.top }))
    );
  });

  it("repacks a column using the real heights, not the vacated slot", () => {
    // The first card is five times the height of the others, so moving it to the end
    // cannot simply hand it the last card's box.
    const unevenColumns = [
      { left: 0, top: 0, height: 100 },
      { left: 100, top: 0, height: 20 },
      { left: 200, top: 0, height: 20 },
      { left: 0, top: 110, height: 20 },
      { left: 100, top: 30, height: 20 },
      { left: 200, top: 30, height: 20 },
    ];

    expect(masonryLayoutAfterMove(unevenColumns, 0, 5)).toEqual([
      { x: 200, y: 30 }, // the tall card, now second in the last column
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 0, y: 30 },
      { x: 100, y: 30 },
    ]);
  });

  it("copes with fewer cards than columns", () => {
    const twoCards = [
      { left: 0, top: 0, height: 40 },
      { left: 100, top: 0, height: 60 },
    ];

    expect(masonryLayoutAfterMove(twoCards, 1, 0)).toEqual([
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it("has nothing to say about an empty list", () => {
    expect(masonryLayoutAfterMove([], 0, 0)).toBeNull();
  });
});
