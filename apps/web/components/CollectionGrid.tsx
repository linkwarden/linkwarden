import { ReactNode, useCallback, useMemo } from "react";
import CollectionCard from "@/components/CollectionCard";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";
import VirtualRows, {
  useBreakpointColumns,
  useVirtualRows,
} from "@/components/VirtualRows";

export type CollectionGridSection = {
  header?: ReactNode;
  collections: CollectionIncludingMembersAndLinkCount[];
  // Space between cards, in px, across and down.
  gap: number;
};

type Row = { key: string; paddingBottom: number } & (
  | { header: ReactNode }
  | { collections: CollectionIncludingMembersAndLinkCount[]; gap: number }
);

// Space after a section, the page's gap-5.
const SECTION_GAP = 20;

// A card's height (min-h-[9rem] plus its border); rows are measured once drawn.
const ESTIMATED_CARD_HEIGHT = 146;
const ESTIMATED_HEADER_HEIGHT = 48;

// Matches the grid classes below: one column, two from sm, three from xl, four
// from 2xl.
const COLUMN_QUERIES: [string, number][] = [
  ["(min-width: 1536px)", 4],
  ["(min-width: 1280px)", 3],
  ["(min-width: 640px)", 2],
];

// Collection cards in a grid, rendering only the rows near the visible part of
// the page, so thousands of collections don't all mount at once.
export default function CollectionGrid({
  sections,
}: {
  sections: CollectionGridSection[];
}) {
  const columns = useBreakpointColumns(COLUMN_QUERIES, 1);

  const rows = useMemo(() => {
    const rows: Row[] = [];

    sections.forEach((section, sectionIndex) => {
      if (section.collections.length === 0) return;

      if (section.header)
        rows.push({
          key: `${sectionIndex}-header`,
          header: section.header,
          paddingBottom: SECTION_GAP,
        });

      for (let i = 0; i < section.collections.length; i += columns)
        rows.push({
          // Keyed by column count too, so a measured height isn't reused for a
          // row holding different cards.
          key: `${sectionIndex}-${columns}-${i}`,
          collections: section.collections.slice(i, i + columns),
          gap: section.gap,
          paddingBottom: section.gap,
        });

      rows[rows.length - 1].paddingBottom = SECTION_GAP;
    });

    if (rows.length > 0) rows[rows.length - 1].paddingBottom = 0;

    return rows;
  }, [sections, columns]);

  const virtualRows = useVirtualRows({
    count: rows.length,
    getItemKey: (index) => rows[index].key,
    estimateSize: (index) =>
      ("header" in rows[index]
        ? ESTIMATED_HEADER_HEIGHT
        : ESTIMATED_CARD_HEIGHT) + rows[index].paddingBottom,
  });

  const renderRow = useCallback(
    (index: number) => {
      const row = rows[index];

      return (
        <div style={{ paddingBottom: row.paddingBottom }}>
          {"header" in row ? (
            row.header
          ) : (
            <div
              className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1"
              style={{ gap: row.gap }}
            >
              {row.collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          )}
        </div>
      );
    },
    [rows]
  );

  return <VirtualRows rows={virtualRows} renderRow={renderRow} />;
}
