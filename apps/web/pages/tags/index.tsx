import MainLayout from "@/layouts/MainLayout";
import PageHeader from "@/components/PageHeader";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { useTags } from "@linkwarden/router/tags";
import TagCard from "@/components/TagCard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NewTagModal from "@/components/ModalContent/NewTagModal";
import BulkDeleteTagsModal from "@/components/ModalContent/BulkDeleteTagsModal";

export default function Tags() {
  const { t } = useTranslation();

  const { data: tags = [] } = useTags();

  const [newTagModal, setNewTagModal] = useState(false);
  const [bulkDeleteTagsModal, setBulkDeleteTagsModal] = useState(false);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <PageHeader icon={"bi-hash"} title={t("tags")} />
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="text-neutral" variant="ghost" size="icon">
                    <i className={"bi-three-dots text-neutral text-xl"}></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem onSelect={() => setNewTagModal(true)}>
                    <i className="bi-plus-lg" />
                    {t("new_tag")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setBulkDeleteTagsModal(true)}
                  >
                    <i className="bi-trash" />
                    {t("bulk_delete_tags")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid 2xl:grid-cols-6 xl:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-5">
          {tags
            .slice()
            .sort((a, b) => b.id - a.id)
            .map((tag) => (
              <TagCard key={tag.id} tag={tag} />
            ))}
        </div>
      </div>
      {newTagModal && <NewTagModal onClose={() => setNewTagModal(false)} />}
      {bulkDeleteTagsModal && (
        <BulkDeleteTagsModal onClose={() => setBulkDeleteTagsModal(false)} />
      )}
    </MainLayout>
  );
}

export { getServerSideProps };
