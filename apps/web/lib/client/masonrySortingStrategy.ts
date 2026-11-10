import type { SortingStrategy } from "@dnd-kit/sortable";

export type MasonryBox = { left: number; top: number; height: number };
type Box = MasonryBox;
type Place = { x: number; y: number };

/**
 * Read the column geometry back off the cards as they are laid out.
 *
 * How many columns there are lives inside MasonryView, behind the breakpoints and the
 * reader's own column setting, and a sorting strategy is only handed rects. It doesn't
 * need telling though: each column is one grid cell with its own left edge, so the
 * distinct left edges are the columns, and the vertical gap shows up between any two
 * cards that share one.
 */
function readColumns(boxes: Box[]) {
  if (boxes.length === 0) return null;

  const lefts = Array.from(
    new Set(boxes.map((box) => Math.round(box.left)))
  ).sort((a, b) => a - b);

  const tops = lefts.map((left) =>
    Math.min(
      ...boxes
        .filter((box) => Math.round(box.left) === left)
        .map((box) => box.top)
    )
  );

  // Cards `lefts.length` apart in index order share a column, so the first such pair
  // that really is stacked shows the gap. None means no column holds two cards, and
  // then nothing is ever stacked and the gap cannot matter.
  let gap = 0;
  for (let i = 0; i + lefts.length < boxes.length; i++) {
    const stacked =
      boxes[i + lefts.length].top - (boxes[i].top + boxes[i].height);
    if (stacked >= 0) {
      gap = stacked;
      break;
    }
  }

  return { lefts, tops, columnCount: lefts.length, gap };
}

/**
 * Where every card ends up once the one at `activeIndex` has moved to `overIndex`.
 *
 * react-masonry-css puts card `i` in column `i % columnCount` and stacks each column
 * top to bottom, so the layout after a move is not a guess: apply the move to the
 * order, then pack it again with the heights already measured. Exported for the test.
 */
export function masonryLayoutAfterMove(
  boxes: Box[],
  activeIndex: number,
  overIndex: number
): Place[] | null {
  const columns = readColumns(boxes);
  if (!columns) return null;

  const order = boxes.map((_, index) => index);
  const [moved] = order.splice(activeIndex, 1);
  order.splice(overIndex, 0, moved);

  const nextTop = [...columns.tops];
  const places: Place[] = new Array(boxes.length);

  order.forEach((card, placeAt) => {
    const column = placeAt % columns.columnCount;

    places[card] = { x: columns.lefts[column], y: nextTop[column] };
    nextTop[column] += boxes[card].height + columns.gap;
  });

  return places;
}

/**
 * Opens a gap in a masonry list for the card being dragged.
 *
 * dnd-kit's rectSortingStrategy swaps the rects themselves around, so a card takes
 * over its neighbour's exact box. That only holds when every card is the same size.
 * In masonry a tall card sent to a short card's slot would be drawn over whatever sits
 * below it, so this works out the real layout the drop would produce instead.
 *
 * The list is virtualized, so dnd-kit only has rects for the cards that are mounted,
 * while packing a column needs every card above. `getBoxes` supplies all of them, in
 * the list's own coordinates, from the column virtualizers.
 */
export function createMasonrySortingStrategy(
  getBoxes: () => Box[] | null
): SortingStrategy {
  // dnd-kit asks for a transform once per card on every frame of a drag, and the
  // packing is one answer that covers all of them. `rects` holds a single identity
  // for as long as the measurements do, so remembering the last answer turns the
  // work from O(n^2) a frame into O(n).
  let lastPacking: {
    rects: unknown;
    activeIndex: number;
    overIndex: number;
    boxes: Box[] | null;
    places: Place[] | null;
  } | null = null;

  return ({ rects, activeIndex, overIndex, index }) => {
    if (activeIndex < 0 || overIndex < 0) return null;

    if (
      !lastPacking ||
      lastPacking.rects !== rects ||
      lastPacking.activeIndex !== activeIndex ||
      lastPacking.overIndex !== overIndex
    ) {
      const boxes = getBoxes();
      lastPacking = {
        rects,
        activeIndex,
        overIndex,
        boxes,
        places: boxes && masonryLayoutAfterMove(boxes, activeIndex, overIndex),
      };
    }

    const place = lastPacking.places?.[index];
    const box = lastPacking.boxes?.[index];

    if (!place || !box) return null;

    return {
      x: place.x - box.left,
      y: place.y - box.top,
      scaleX: 1,
      scaleY: 1,
    };
  };
}
