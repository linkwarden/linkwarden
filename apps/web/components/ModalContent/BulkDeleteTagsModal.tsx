import React, { useLayoutEffect, useRef, useState } from "react";
import TextInput from "@/components/TextInput";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";
import { useBulkTagDeletion, useUpsertTags } from "@linkwarden/router/tags";
import { Trans, useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
};

export default function BulkDeleteTagsModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [numberOfLinks, setNumberOfLinks] = useState(0);
  const bulkDeleteTags = useBulkTagDeletion();

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("bulk_delete_tags")}</p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <div className="flex justify-between flex-wrap">
          <div className="flex gap-2 items-center">
            <Trans
              i18nKey="delete_tags_by_number_of_links"
              components={[
                <TextInput
                  value={numberOfLinks}
                  onChange={(e) => setNumberOfLinks(Number(e.target.value))}
                  type="number"
                  min={0}
                  className="bg-base-200 max-w-12 h-10"
                />,
              ]}
            />
          </div>

          <Button
            variant="destructive"
            onClick={() => {
              bulkDeleteTags.mutate(
                { numberOfLinks: Number(numberOfLinks) },
                {
                  onSuccess: (data: number) => {
                    if (data === 1) {
                      toast.success(
                        t("count_tag_deleted", {
                          count: data,
                        })
                      );
                    } else {
                      toast.success(
                        t("count_tags_deleted", {
                          count: data,
                        })
                      );
                    }
                    onClose();
                  },
                  onError: () => {
                    toast.error(t("error_deleting_tags"));
                  },
                }
              );
            }}
          >
            {t("delete")}
          </Button>
        </div>

        <div className="flex justify-between flex-wrap">
          <div className="flex gap-2 items-center">{t("delete_all_tags")}</div>

          <Button
            variant="destructive"
            className="capitalize"
            onClick={() => {
              bulkDeleteTags.mutate(
                { allTags: true },
                {
                  onSuccess: (data: number) => {
                    if (data === 1) {
                      toast.success(
                        t("count_tag_deleted", {
                          count: data,
                        })
                      );
                    } else {
                      toast.success(
                        t("count_tags_deleted", {
                          count: data,
                        })
                      );
                    }
                    onClose();
                  },
                  onError: () => {
                    toast.error(t("error_deleting_tags"));
                  },
                }
              );
            }}
          >
            {t("delete_all_tags")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
