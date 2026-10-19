import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
  ViewMode,
} from "@linkwarden/types/global";
import {
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import LinkMasonry from "@/components/LinkViews/LinkComponents/LinkMasonry";
import { useMemo } from "react";
import LinkList from "@/components/LinkViews/LinkComponents/LinkList";
import useLocalSettingsStore from "@/store/localSettings";
import { useCollections } from "@linkwarden/router/collections";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { TFunction } from "i18next";
import useLinkStore from "@/store/links";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useUser } from "@linkwarden/router/user";
import { useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableLink from "@/components/LinkViews/SortableLink";
import {
  createMasonrySortingStrategy,
  MasonryBox,
} from "@/lib/client/masonrySortingStrategy";
import VirtualRows, {
  useVirtualRows,
  VirtualRowsState,
} from "@/components/VirtualRows";
import { VirtualItem } from "@tanstack/react-virtual";

// Where the next page goes while it loads: a skeleton laid out as one more card,
// which fetches the page once it's in view.
const NEXT_PAGE = "next-page";
type Slot = LinkIncludingShortenedCollectionAndTags | typeof NEXT_PAGE;

const withNextPage = (
  links: LinkIncludingShortenedCollectionAndTags[],
  showNextPage: boolean
): Slot[] => (showNextPage ? [...links, NEXT_PAGE] : links);

// Rough heights until rows are measured (user1's links on a 1440px screen).
const ESTIMATED_CARD_HEIGHT = 238;
const ESTIMATED_MASONRY_CARD_HEIGHT = 170;
const ESTIMATED_LIST_ROW_HEIGHT = 66;

// gap-3, between cards both ways.
const CARD_GAP = 12;

// The link being dragged has to stay mounted while the list scrolls under it.
// A reordering drag carries the link's id as a number, a drag onto a collection
// or tag as a string. While links are being dragged into a new order, rows the
// drag scrolls into view shouldn't fade in.
function useLinkDrag(links: LinkIncludingShortenedCollectionAndTags[]) {
  const { active } = useDndContext();
  const activeId = active ? Number(active.id) : undefined;

  // The drag ends one render before the list shows the move. In that render the
  // link would be back at its old place, often far off screen, and unmount, to
  // mount again (fading in) where it was dropped. So it stays mounted until the
  // links change.
  const lastDrag = useRef<{
    id: number;
    links: LinkIncludingShortenedCollectionAndTags[];
  }>(undefined);
  if (activeId !== undefined) lastDrag.current = { id: activeId, links };

  const keptId =
    activeId ??
    (lastDrag.current?.links === links ? lastDrag.current.id : undefined);

  const draggedIndex = useMemo(
    () =>
      keptId === undefined ? -1 : links.findIndex((link) => link.id === keptId),
    [links, keptId]
  );

  return { draggedIndex, reordering: !!active?.data.current?.sortable };
}

function CardView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  user,
  disableDraggable,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
  canReorder,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  user: any;
  disableDraggable: boolean;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
  canReorder: boolean;
}) {
  const settings = useLocalSettingsStore((state) => state.settings);

  const gridMap = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1501) return 5;
    if (width >= 881) return 4;
    if (width >= 701) return 3;
    if (width >= 501) return 2;
    return 1;
  };

  const [columnCount, setColumnCount] = useState(
    settings.columns || getColumnCount()
  );

  const gridColClass = useMemo(
    () => gridMap[columnCount as keyof typeof gridMap],
    [columnCount]
  );

  const heightMap = {
    1: "h-44",
    2: "h-40",
    3: "h-36",
    4: "h-32",
    5: "h-28",
    6: "h-24",
    7: "h-20",
    8: "h-20",
  };

  const imageHeightClass = useMemo(
    () =>
      columnCount ? heightMap[columnCount as keyof typeof heightMap] : "h-40",
    [columnCount]
  );

  useEffect(() => {
    const handleResize = () => {
      if (settings.columns === 0) {
        // Only recalculate if zustandColumns is zero
        setColumnCount(getColumnCount());
      }
    };

    if (settings.columns === 0) {
      window.addEventListener("resize", handleResize);
    }

    setColumnCount(settings.columns || getColumnCount());

    return () => {
      if (settings.columns === 0) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [settings.columns]);

  const slots = useMemo(
    () => withNextPage(links, hasNextPage || isLoading),
    [links, hasNextPage, isLoading]
  );

  // Read here rather than through isSelected so a row re-renders when its
  // link is selected: rows only render again when renderRow changes.
  const selectedIds = useLinkStore((state) => state.selectedIds);

  const { draggedIndex, reordering } = useLinkDrag(links);

  const rows = useVirtualRows({
    count: Math.ceil(slots.length / columnCount),
    // Keyed by column count too, so a measured height isn't reused for a row
    // holding different cards.
    getItemKey: (row) => `${columnCount}-${row}`,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    gap: CARD_GAP,
    keepMounted:
      draggedIndex >= 0 ? [Math.floor(draggedIndex / columnCount)] : [],
    fadeIn: !reordering,
  });

  const renderRow = useCallback(
    (row: number) => (
      <div className={`${gridColClass} grid gap-3`}>
        {slots.slice(row * columnCount, (row + 1) * columnCount).map((e) => {
          if (e === NEXT_PAGE)
            return (
              <div
                key={NEXT_PAGE}
                className="flex flex-col gap-4"
                ref={placeHolderRef}
              >
                <div className="skeleton h-40 w-full"></div>
                <div className="skeleton h-3 w-2/3"></div>
                <div className="skeleton h-3 w-full"></div>
                <div className="skeleton h-3 w-full"></div>
                <div className="skeleton h-3 w-1/3"></div>
              </div>
            );

          const collection = collectionsById.get(e.collection.id as number);
          const selected = !!selectedIds[e.id as number];

          return (
            <SortableLink key={e.id} link={e} disabled={!canReorder} fillHeight>
              <LinkCard
                link={e}
                collection={
                  collection as CollectionIncludingMembersAndLinkCount
                }
                isPublicRoute={isPublicRoute}
                t={t}
                user={user}
                disableDraggable={disableDraggable}
                isSelected={selected}
                toggleSelected={toggleSelected}
                editMode={editMode}
                imageHeightClass={imageHeightClass}
              />
            </SortableLink>
          );
        })}
      </div>
    ),
    [
      slots,
      columnCount,
      gridColClass,
      placeHolderRef,
      collectionsById,
      selectedIds,
      canReorder,
      isPublicRoute,
      t,
      user,
      disableDraggable,
      toggleSelected,
      editMode,
      imageHeightClass,
    ]
  );

  return (
    <div className="pb-3">
      <VirtualRows rows={rows} renderRow={renderRow} />
    </div>
  );
}

function MasonryView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  disableDraggable,
  user,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
  canReorder,
  geometry,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  disableDraggable: boolean;
  user: any;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
  canReorder: boolean;
  geometry: MutableRefObject<MasonryColumnGeometry[]>;
}) {
  const settings = useLocalSettingsStore((state) => state.settings);

  const gridMap = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  // The breakpoints react-masonry-css used when it laid the columns out: up to
  // 500px wide one column, up to 700 two, up to 881 three, up to 1500 four.
  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width > 1500) return 5;
    if (width > 881) return 4;
    if (width > 700) return 3;
    if (width > 500) return 2;
    return 1;
  };

  const [columnCount, setColumnCount] = useState(
    settings.columns || getColumnCount()
  );

  const gridColClass = useMemo(
    () => gridMap[columnCount as keyof typeof gridMap],
    [columnCount]
  );

  const heightMap = {
    1: "h-44",
    2: "h-40",
    3: "h-36",
    4: "h-32",
    5: "h-28",
    6: "h-24",
    7: "h-20",
    8: "h-20",
  };

  const imageHeightClass = useMemo(
    () =>
      columnCount ? heightMap[columnCount as keyof typeof heightMap] : "h-40",
    [columnCount]
  );

  useEffect(() => {
    const handleResize = () => {
      if (settings.columns === 0) {
        // Only recalculate if zustandColumns is zero
        setColumnCount(getColumnCount());
      }
    };

    if (settings.columns === 0) {
      window.addEventListener("resize", handleResize);
    }

    setColumnCount(settings.columns || getColumnCount());

    return () => {
      if (settings.columns === 0) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [settings.columns]);

  const slots = useMemo(
    () => withNextPage(links, hasNextPage || isLoading),
    [links, hasNextPage, isLoading]
  );

  // Read here rather than through isSelected so a row re-renders when its
  // link is selected: rows only render again when renderRow changes.
  const selectedIds = useLinkStore((state) => state.selectedIds);

  const { draggedIndex, reordering } = useLinkDrag(links);

  // Only this many columns hold cards now, so the ones from a wider layout are
  // no longer there for the sorting strategy to read.
  geometry.current.length = columnCount;

  // What each column has on the page, so a card a reorder moves to another
  // column shows up there without fading in.
  const mountedByColumn = useRef(
    new Map<number, Set<VirtualItem["key"]>>()
  ).current;

  const renderSlot = useCallback(
    (e: Slot) => {
      if (e === NEXT_PAGE)
        return (
          <div className="flex flex-col gap-4" ref={placeHolderRef}>
            <div className="skeleton h-40 w-full"></div>
            <div className="skeleton h-3 w-2/3"></div>
            <div className="skeleton h-3 w-full"></div>
            <div className="skeleton h-3 w-full"></div>
            <div className="skeleton h-3 w-1/3"></div>
          </div>
        );

      const collection = collectionsById.get(e.collection.id as number);
      const selected = !!selectedIds[e.id as number];

      return (
        <SortableLink link={e} disabled={!canReorder}>
          <LinkMasonry
            link={e}
            collection={collection as CollectionIncludingMembersAndLinkCount}
            isPublicRoute={isPublicRoute}
            t={t}
            disableDraggable={disableDraggable}
            user={user}
            isSelected={selected}
            toggleSelected={toggleSelected}
            imageHeightClass={imageHeightClass}
            editMode={editMode}
          />
        </SortableLink>
      );
    },
    [
      placeHolderRef,
      collectionsById,
      selectedIds,
      canReorder,
      isPublicRoute,
      t,
      disableDraggable,
      user,
      toggleSelected,
      imageHeightClass,
      editMode,
    ]
  );

  const columnSlots = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, column) =>
        slots.filter((_, index) => index % columnCount === column)
      ),
    [slots, columnCount]
  );

  // Card i goes in column i % columnCount, as react-masonry-css placed them, and
  // each column is its own virtualized list.
  return (
    <div className={`${gridColClass} grid gap-3 pb-3`}>
      {Array.from({ length: columnCount }, (_, column) => (
        <MasonryColumn
          key={`${columnCount}-${column}`}
          column={column}
          slots={columnSlots[column]}
          draggedIndex={
            draggedIndex >= 0 && draggedIndex % columnCount === column
              ? Math.floor(draggedIndex / columnCount)
              : -1
          }
          geometry={geometry}
          renderSlot={renderSlot}
          fadeIn={!reordering}
          mountedByColumn={mountedByColumn}
        />
      ))}
    </div>
  );
}

type MasonryColumnGeometry = {
  element: HTMLDivElement | null;
  rows: VirtualRowsState;
};

function MasonryColumn({
  column,
  slots,
  draggedIndex,
  geometry,
  renderSlot,
  fadeIn,
  mountedByColumn,
}: {
  column: number;
  slots: Slot[];
  draggedIndex: number;
  geometry: MutableRefObject<MasonryColumnGeometry[]>;
  renderSlot: (slot: Slot) => ReactNode;
  fadeIn: boolean;
  mountedByColumn: Map<number, Set<VirtualItem["key"]>>;
}) {
  const element = useRef<HTMLDivElement>(null);

  const rows = useVirtualRows({
    count: slots.length,
    getItemKey: (index) => {
      const slot = slots[index];
      return slot === NEXT_PAGE ? NEXT_PAGE : (slot.id as number);
    },
    estimateSize: () => ESTIMATED_MASONRY_CARD_HEIGHT,
    gap: CARD_GAP,
    keepMounted: [draggedIndex],
    fadeIn,
    group: { id: column, mounted: mountedByColumn },
  });

  useLayoutEffect(() => {
    geometry.current[column] = { element: element.current, rows };
  });

  const renderRow = useCallback(
    (index: number) => renderSlot(slots[index]),
    [renderSlot, slots]
  );

  return (
    <div ref={element} className="w-full">
      <VirtualRows rows={rows} renderRow={renderRow} />
    </div>
  );
}

// Every card's box, mounted or not, read off the column virtualizers so the
// sorting strategy can pack whole columns: card i is card i / columns of column
// i % columns.
const masonryBoxes = (
  columns: MasonryColumnGeometry[],
  count: number
): MasonryBox[] | null => {
  const boxes: MasonryBox[] = [];

  for (let i = 0; i < count; i++) {
    const column = columns[i % columns.length];
    const item =
      column?.rows.virtualizer.measurementsCache[
        Math.floor(i / columns.length)
      ];

    if (!column?.element || !item) return null;

    boxes.push({
      left: column.element.offsetLeft,
      top: item.start,
      height: item.size,
    });
  }

  return boxes;
};

function ListView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  disableDraggable,
  user,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
  canReorder,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  disableDraggable: boolean;
  user: any;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
  canReorder: boolean;
}) {
  const slots = useMemo(
    () => withNextPage(links, hasNextPage || isLoading),
    [links, hasNextPage, isLoading]
  );

  // Read here rather than through isSelected so a row re-renders when its
  // link is selected: rows only render again when renderRow changes.
  const selectedIds = useLinkStore((state) => state.selectedIds);

  const { draggedIndex, reordering } = useLinkDrag(links);

  const rows = useVirtualRows({
    count: slots.length,
    getItemKey: (index) => {
      const slot = slots[index];
      return slot === NEXT_PAGE ? NEXT_PAGE : (slot.id as number);
    },
    estimateSize: () => ESTIMATED_LIST_ROW_HEIGHT,
    keepMounted: [draggedIndex],
    fadeIn: !reordering,
  });

  const renderRow = useCallback(
    (i: number) => {
      const e = slots[i];

      if (e === NEXT_PAGE)
        return (
          <div ref={placeHolderRef} className="flex gap-2 py-2 px-1">
            <div className="skeleton h-12 w-12"></div>
            <div className="flex flex-col gap-3 w-full">
              <div className="skeleton h-2 w-2/3"></div>
              <div className="skeleton h-2 w-full"></div>
              <div className="skeleton h-2 w-1/3"></div>
            </div>
          </div>
        );

      const collection = collectionsById.get(e.collection.id as number);
      const selected = !!selectedIds[e.id as number];

      return (
        <SortableLink link={e} disabled={!canReorder}>
          <LinkList
            link={e}
            collection={collection as CollectionIncludingMembersAndLinkCount}
            isPublicRoute={isPublicRoute}
            t={t}
            disableDraggable={disableDraggable}
            user={user}
            isSelected={selected}
            toggleSelected={toggleSelected}
            count={i}
            editMode={editMode}
          />
        </SortableLink>
      );
    },
    [
      slots,
      placeHolderRef,
      collectionsById,
      selectedIds,
      canReorder,
      isPublicRoute,
      t,
      disableDraggable,
      user,
      toggleSelected,
      editMode,
    ]
  );

  return <VirtualRows rows={rows} renderRow={renderRow} />;
}

export default function Links({
  layout,
  links,
  editMode,
  useData,
  reorderable,
}: {
  layout: ViewMode;
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  useData?: any;
  /**
   * Whether this list is in an order the viewer is allowed to rearrange. Only the page
   * that owns the list knows that, so it says so here and registers what to do with a
   * drop through useRegisterLinkReorder.
   */
  reorderable?: boolean;
}) {
  const { ref, inView } = useInView();

  const { t } = useTranslation();
  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  useEffect(() => {
    if (!inView) return;
    if (!useData.hasNextPage) return;
    if (useData.isFetchingNextPage) return;

    useData.fetchNextPage();
  }, [
    inView,
    useData.hasNextPage,
    useData.isFetchingNextPage,
    useData.fetchNextPage,
  ]);

  const { data: collections = [] } = useCollections();

  const collectionsById = useMemo(() => {
    const m = new Map<number, (typeof collections)[number]>();
    for (const c of collections) m.set(c.id as any, c);
    return m;
  }, [collections]);

  const { clearSelected, toggleSelected } = useLinkStore();

  useEffect(() => {
    if (!editMode) {
      clearSelected();
    }
  }, [editMode]);

  const isTouchLayout = useMediaQuery("(max-width: 1023px)");

  // Same breakpoint the drag-onto-a-collection gesture already uses: below it a drag
  // and a scroll are hard to tell apart, so neither is offered.
  const canReorder = !!reorderable && !isTouchLayout;

  // While a list can be reordered, SortableLink is the drag source for each card, so
  // the card's own draggable has to stand down or both would answer the same gesture.
  const disableDraggable = isTouchLayout || canReorder;

  const { data: user } = useUser();

  const sortableIds = useMemo(
    () => (links || []).map((e) => e.id as number),
    [links]
  );

  const masonryGeometry = useRef<MasonryColumnGeometry[]>([]);

  const masonryStrategy = useMemo(
    () =>
      createMasonrySortingStrategy(() =>
        masonryBoxes(masonryGeometry.current, sortableIds.length)
      ),
    [sortableIds.length]
  );

  const sortingStrategy =
    layout === ViewMode.List
      ? verticalListSortingStrategy
      : layout === ViewMode.Masonry
        ? masonryStrategy
        : rectSortingStrategy;

  let view;

  if (layout === ViewMode.List) {
    view = (
      <ListView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        disableDraggable={disableDraggable}
        user={user}
        toggleSelected={toggleSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
        canReorder={canReorder}
      />
    );
  } else if (layout === ViewMode.Masonry) {
    view = (
      <MasonryView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        disableDraggable={disableDraggable}
        user={user}
        toggleSelected={toggleSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
        canReorder={canReorder}
        geometry={masonryGeometry}
      />
    );
  } else {
    // Default to card view
    view = (
      <CardView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        user={user}
        disableDraggable={disableDraggable}
        toggleSelected={toggleSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
        canReorder={canReorder}
      />
    );
  }

  return (
    <SortableContext items={sortableIds} strategy={sortingStrategy}>
      {view}
    </SortableContext>
  );
}
