import {
  memo,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  defaultRangeExtractor,
  useVirtualizer,
  VirtualItem,
} from "@tanstack/react-virtual";
import { cn } from "@linkwarden/lib/utils";

// Shared by every virtualized list (links, tags, collections, the collection
// picker), so they can be tuned in one place.

// Rows rendered past each edge of the screen, above and below, so they're ready
// before they scroll in. In a grid a row is one line of cards, so each extra row
// mounts a line's worth more. They stay invisible until they're within
// FADE_IN_AHEAD_ROWS of the screen, then fade in.
export const OVERSCAN_ROWS = 3;

// How many rows past each edge of the screen start fading in, so the fade can
// finish before a row scrolls into view. 0 fades rows in as they reach the
// screen. Only mounted rows can fade, so values from OVERSCAN_ROWS up behave
// the same: every row fades in as soon as it mounts.
export const FADE_IN_AHEAD_ROWS = 2;

// MainLayout and the sidebar scroll inner elements rather than the window, and
// a dropdown menu scrolls itself.
const getScrollParent = (element: HTMLElement) => {
  for (let el = element.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return document.documentElement;
};

// Columns for a grid whose column count follows breakpoints: the count of the
// first query that matches, else `fallback`. `queries` must be a constant
// defined outside the component, widest breakpoint first.
export function useBreakpointColumns(
  queries: [string, number][],
  fallback: number
) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const lists = queries.map(([query]) => window.matchMedia(query));
      lists.forEach((list) => list.addEventListener("change", onChange));
      return () =>
        lists.forEach((list) => list.removeEventListener("change", onChange));
    },
    [queries]
  );

  const getColumns = useCallback(
    () =>
      queries.find(([query]) => window.matchMedia(query).matches)?.[1] ??
      fallback,
    [queries, fallback]
  );

  return useSyncExternalStore(subscribe, getColumns, () => fallback);
}

type VirtualRowsOptions = {
  count: number;
  getItemKey: (index: number) => string | number;
  estimateSize: (index: number) => number;
  // Space between rows, in px.
  gap?: number;
  // Rows that stay mounted wherever the list is scrolled to, like the one
  // holding a card that's being dragged.
  keepMounted?: number[];
  // False while rows shouldn't fade in, like while links are being dragged into
  // a new order: rows that mount meanwhile just appear.
  fadeIn?: boolean;
  // Shared by lists drawn as one (masonry's columns, `id` being the column), so
  // a row that moves from one to another, like a card changing columns after a
  // reorder, doesn't fade in again.
  group?: { id: number; mounted: Map<number, Set<VirtualItem["key"]>> };
};

export type VirtualRowsState = ReturnType<typeof useVirtualRows>;

// Renders only the rows near the visible part of whatever scrolls the list, and
// fades them in as they come into view (opacity over 150ms, linear). Pair it
// with <VirtualRows>.
export function useVirtualRows({
  count,
  getItemKey,
  estimateSize,
  gap = 0,
  keepMounted = [],
  fadeIn = true,
  group,
}: VirtualRowsOptions) {
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (!list) return;

    const scroller = getScrollParent(list);
    setScrollElement(scroller);

    // Where the list starts within the scrolled content. What's above it can
    // change height (a header wrapping, a tree expanding), so watch the content
    // as well as the scroller.
    const measure = () =>
      setScrollMargin(
        list.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop
      );

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild)
      observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [list]);

  const kept = keepMounted.filter((index) => index >= 0 && index < count);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollElement,
    getItemKey,
    estimateSize,
    gap,
    overscan: OVERSCAN_ROWS,
    scrollMargin,
    // Re-render in React's own batch rather than synchronously inside the scroll
    // handler. Several lists can share one scroller (masonry has one per
    // column), and each reads scrollTop: a synchronous render between those
    // reads forces a layout of the whole page for every one of them.
    useFlushSync: false,
    rangeExtractor:
      kept.length > 0
        ? (range) =>
            Array.from(
              new Set([...defaultRangeExtractor(range), ...kept])
            ).sort((a, b) => a - b)
        : defaultRangeExtractor,
  });

  const items = virtualizer.getVirtualItems();

  // The fade starts when a row comes within FADE_IN_AHEAD_ROWS of the screen
  // rather than when it mounts. Once shown, a row stays shown while it's
  // mounted, so one sitting at the edge of that band doesn't fade again;
  // scrolled far enough to unmount, it fades in again when it comes back. A row
  // that was already on the page somewhere in the group, or one that mounts
  // while fading is off, is shown without a fade.
  const rowStates = useRef(
    new Map<VirtualItem["key"], "fading-in" | "shown">()
  ).current;
  const mountedRows = new Set(items.map((item) => item.key));

  rowStates.forEach((_, key) => {
    if (!mountedRows.has(key)) rowStates.delete(key);
  });

  const visibleRows = virtualizer.range;

  const wasOnPage = (key: VirtualItem["key"]) =>
    !!group && Array.from(group.mounted.values()).some((keys) => keys.has(key));

  items.forEach((item) => {
    if (rowStates.has(item.key)) return;

    if (!fadeIn || wasOnPage(item.key)) rowStates.set(item.key, "shown");
    else if (
      visibleRows &&
      item.index >= visibleRows.startIndex - FADE_IN_AHEAD_ROWS &&
      item.index <= visibleRows.endIndex + FADE_IN_AHEAD_ROWS
    )
      rowStates.set(item.key, "fading-in");
  });

  // What this list has on the page, for the rest of its group to check once
  // they render next.
  useLayoutEffect(() => {
    group?.mounted.set(group.id, mountedRows);
  });

  useLayoutEffect(
    () => () => {
      group?.mounted.delete(group.id);
    },
    []
  );

  const fadeClassName = (item: VirtualItem) => {
    const state = rowStates.get(item.key);

    if (state === "fading-in")
      return "motion-safe:animate-[fade-in-animation_150ms_linear]";
    if (state === "shown") return undefined;
    return "motion-safe:opacity-0";
  };

  // Once a row has faded in it loses the animation: React moves rows around the
  // DOM when they're reordered, and moving an element restarts its animation.
  // The next render (a reorder is one) drops the class.
  const fadedIn = (key: VirtualItem["key"]) => {
    if (rowStates.get(key) === "fading-in") rowStates.set(key, "shown");
  };

  return {
    listRef: setList,
    virtualizer,
    items,
    scrollMargin,
    fadeClassName,
    fadedIn,
  };
}

// A mounted row re-renders only when renderRow changes, not every time the list
// scrolls far enough to mount or unmount another row.
const Row = memo(function Row({
  index,
  renderRow,
}: {
  index: number;
  renderRow: (index: number) => ReactNode;
}) {
  return <>{renderRow(index)}</>;
});

// `renderRow` should keep its identity between renders (wrap it in useCallback
// with whatever the rows show), so rows already on screen aren't rendered again
// while the list scrolls.
export default function VirtualRows({
  rows,
  renderRow,
  className,
}: {
  rows: VirtualRowsState;
  renderRow: (index: number) => ReactNode;
  className?: string;
}) {
  const { listRef, virtualizer, items, scrollMargin, fadeClassName, fadedIn } =
    rows;

  return (
    <div
      ref={listRef}
      // Its rows are absolutely positioned, so the list has no content height of
      // its own, and in a flex column (most pages are full-height ones) it would
      // otherwise shrink to the screen.
      className={cn("relative w-full shrink-0", className)}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          data-index={item.index}
          ref={virtualizer.measureElement}
          className={cn("absolute top-0 left-0 w-full", fadeClassName(item))}
          style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
          onAnimationEnd={(event) => {
            // Not the animations of whatever is inside the row.
            if (event.target === event.currentTarget) fadedIn(item.key);
          }}
        >
          <Row index={item.index} renderRow={renderRow} />
        </div>
      ))}
    </div>
  );
}
