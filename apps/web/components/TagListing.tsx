import { Tag } from "@linkwarden/prisma/client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Droppable from "./Droppable";
import { cn } from "@linkwarden/lib/utils";
import { useDndContext } from "@dnd-kit/core";

interface TagListingProps {
  tags: Tag[];
  active?: string;
}

export default function TagListing({ tags, active }: TagListingProps) {
  const { active: droppableActive } = useDndContext();
  const { t } = useTranslation();

  if (!tags[0]) {
    return (
      <p className="text-neutral text-xs font-semibold truncate w-full px-2">
        {t("you_have_no_tags")}
      </p>
    );
  }

  return (
    <>
      {tags
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .map((e: any, i: any) => {
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
        })}
    </>
  );
}
