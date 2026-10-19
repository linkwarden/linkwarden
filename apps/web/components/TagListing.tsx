import { Tag } from "@linkwarden/prisma/client";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Droppable from "./Droppable";
import { cn } from "@linkwarden/lib/utils";
import { useDndContext } from "@dnd-kit/core";
import VirtualRows, { useVirtualRows } from "./VirtualRows";

interface TagListingProps {
  tags: Tag[];
  active?: string;
}

// A tag row's height until rows are measured.
const ESTIMATED_TAG_ROW_HEIGHT = 28;

export default function TagListing({ tags, active }: TagListingProps) {
  const { active: droppableActive } = useDndContext();
  const { t } = useTranslation();

  const sortedTags = useMemo(
    () => [...tags].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [tags]
  );

  const rows = useVirtualRows({
    count: sortedTags.length,
    getItemKey: (index) => sortedTags[index].id,
    estimateSize: () => ESTIMATED_TAG_ROW_HEIGHT,
    // The sidebar's gap-1.
    gap: 4,
  });

  const renderRow = useCallback(
    (index: number) => {
      const e: any = sortedTags[index];

      return (
        <Droppable
          id={`tag-${e.id}`}
          className="group"
          data={{ type: "tag", id: e.id, name: e.name }}
        >
          <Link href={`/tags/${e.id}`}>
            <div
              className={cn(
                active === `/tags/${e.id}`
                  ? "bg-primary/20"
                  : droppableActive
                    ? "select-none"
                    : "hover:bg-neutral/20",
                "duration-100 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md"
              )}
            >
              <i className="bi-hash text-lg text-primary drop-shadow"></i>
              <p className="truncate w-full pr-7 text-sm">{e.name}</p>
              <div className="drop-shadow text-neutral text-xs">
                {e._count?.links}
              </div>
            </div>
          </Link>
        </Droppable>
      );
    },
    [sortedTags, active, droppableActive]
  );

  if (!tags[0]) {
    return (
      <p className="text-neutral text-xs font-semibold truncate w-full px-2">
        {t("you_have_no_tags")}
      </p>
    );
  }

  return <VirtualRows rows={rows} renderRow={renderRow} />;
}
