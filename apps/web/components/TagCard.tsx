import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { TagIncludingLinkCount } from "@linkwarden/types";
import DeleteTagModal from "./ModalContent/DeleteTagModal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
export default function TagCard({
  tag,
  editMode,
  selected,
  onSelect,
}: {
  tag: TagIncludingLinkCount;
  editMode: boolean;
  selected: boolean;
  onSelect: (tagId: number) => void;
}) {
  const { t } = useTranslation();

  const formattedDate = new Date(tag.createdAt).toLocaleString(t("locale"), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const [deleteTagModal, setDeleteTagModal] = useState(false);

  const router = useRouter();

  return (
    <div
      className={cn(
        "relative rounded-xl p-2 flex gap-2 flex-col shadow-md cursor-pointer hover:shadow-none hover:bg-opacity-70 duration-200 border border-neutral-content",
        editMode ? "bg-base-300" : "bg-base-200",
        selected && "border-primary"
      )}
      onClick={() =>
        editMode ? onSelect(tag.id) : router.push(`/tags/${tag.id}`)
      }
    >
      {editMode ? (
        <Checkbox checked={selected} className="absolute top-3 right-3 z-20" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <i title="More" className="bi-three-dots text-xl text-neutral" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            sideOffset={4}
            side="bottom"
            align="end"
            className="z-[30]"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onSelect={() => setDeleteTagModal(true)}
              className="text-error"
            >
              {t("delete_tag")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <h2 className="truncate leading-tight py-1 pr-8" title={tag.name}>
        {tag.name}
      </h2>

      <div className="flex justify-between items-center mt-auto">
        <div className="text-xs flex gap-1 items-center">
          <i
            className="bi-calendar3 text-neutral"
            title={t("collection_publicly_shared")}
          ></i>
          {formattedDate}
        </div>

        <div className="text-xs flex gap-1 items-center">
          <i
            className="bi-link-45deg text-lg leading-none text-neutral"
            title={t("collection_publicly_shared")}
          ></i>
          {tag._count?.links}
        </div>
      </div>

      {deleteTagModal && (
        <DeleteTagModal
          onClose={() => setDeleteTagModal(false)}
          activeTag={tag}
        />
      )}
    </div>
  );
}
