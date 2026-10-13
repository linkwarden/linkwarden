import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import { cn } from "@/lib/utils";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  /**
   * Stay mounted but inert.
   *
   * Reordering switches on and off while a collection is open -- the sort changes,
   * edit mode opens, permissions arrive, the window crosses the touch breakpoint.
   * Rendering this wrapper only while reordering is on would change the element type
   * at every slot on each of those, and React answers that by throwing away every
   * card and building it again instead of updating it. A disabled sortable costs
   * almost nothing: dnd-kit leaves it out of collision detection and only measures it
   * during a drag.
   */
  disabled: boolean;
  fillHeight?: boolean;
  children: React.ReactNode;
};

// Makes a link both a drag source and a drop target for reordering.
export default function SortableLink({
  link,
  disabled,
  fillHeight,
  children,
}: Props) {
  const sortable = useSortable({
    id: link.id as number,
    disabled,
    data: {
      type: "link",
      linkId: link.id,
      link,
    },
  });

  return (
    <div
      ref={sortable.setNodeRef}
      style={
        disabled
          ? undefined
          : {
              transform: CSS.Translate.toString(sortable.transform),
              transition: sortable.transition,
            }
      }
      className={cn(
        // Named so LinkList's separator can tell whether its row is the last one.
        "group/sortable relative",
        // Only while a drag can actually happen, or a card nobody can reorder would
        // stop being selectable text.
        !disabled && "select-none",
        fillHeight && "h-full",
        sortable.isDragging && "z-10"
      )}
      // dnd-kit's attributes carry role="button" and a tabIndex, which have no
      // business on a card that can't be dragged.
      {...(disabled ? {} : sortable.attributes)}
      {...(disabled ? {} : sortable.listeners)}
    >
      <div
        className={cn(
          fillHeight && "h-full",
          sortable.isDragging && "invisible"
        )}
      >
        {children}
      </div>

      {sortable.isDragging && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-primary bg-primary/5 pointer-events-none" />
      )}
    </div>
  );
}
