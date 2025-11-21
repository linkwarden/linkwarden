import { Tag } from "@linkwarden/prisma/client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Droppable from "./Droppable";
import { cn } from "@linkwarden/lib";
import { useDndContext } from "@dnd-kit/core";

interface TagListingProps {
  tags: Tag[];
  active?: string;
}
export function TagListing({ tags, active }: TagListingProps) {
  const { active: droppableActive } = useDndContext();
  const { t } = useTranslation();

  if (!tags[0]) {
    return (
      <div
        className={`duration-100 py-1 px-2 flex items-center gap-2 w-full rounded-md h-8 capitalize`}
      >
        <p className="text-neutral text-xs font-semibold truncate w-full pr-7">
          {t("you_have_no_tags")}
        </p>
      </div>
    );
  }

  return (
    <>
      {tags.map((e: any, i: any) => {
        return (
          <Droppable
            id={`tag-${e.id}`}
            key={i}
            className="group"
            data={{ type: "tag", id: e.id, name: e.name }}
          >
            <Link key={i} href={`/tags/${e.id}`}>
              <div
                className={cn(
                  active === `/tags/${e.id}`
                    ? "bg-primary/20"
                    : droppableActive
                      ? "select-none"
                      : "hover:bg-neutral/20",
                  "duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8"
                )}
              >
                <i className="bi-hash text-xl text-primary drop-shadow"></i>
                <p className="truncate w-full pr-7">{e.name}</p>
                <div className="drop-shadow text-neutral text-xs">
                  {e._count?.links}
                </div>
              </div>
            </Link>
          </Droppable>
        );
      })}
    </>
  );
}
