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
import { TagIncludingLinkCount } from "@linkwarden/types";
import DeleteTagModal from "./ModalContent/DeleteTagModal";
export default function TagCard({ tag }: { tag: TagIncludingLinkCount }) {
  const { t } = useTranslation();

  const formattedDate = new Date(tag.createdAt).toLocaleString(t("locale"), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const [deleteTagModal, setDeleteTagModal] = useState(false);

  return (
    <div className="relative rounded-xl p-2 flex gap-2 flex-col bg-base-200 shadow-md hover:shadow-none duration-200 border border-neutral-content">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-20"
          >
            <i title="More" className="bi-three-dots text-xl" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          sideOffset={4}
          side="bottom"
          align="end"
          className="z-[30]"
        >
          <DropdownMenuItem
            onSelect={() => setDeleteTagModal(true)}
            className="text-error"
          >
            {t("delete_tag")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <h2 className="text-lg truncate leading-tight py-1" title={tag.name}>
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
