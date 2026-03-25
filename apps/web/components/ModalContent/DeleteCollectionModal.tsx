import React, { useEffect, useState } from "react";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { useDeleteCollection } from "@linkwarden/router/collections";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function DeleteCollectionModal({
  onClose,
  activeCollection,
}: Props) {
  const { t } = useTranslation();
  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);
  const router = useRouter();
  const permissions = usePermissions(collection.id as number);

  useEffect(() => {
    setCollection(activeCollection);
  }, []);

  const deleteCollection = useDeleteCollection({ toast, t });

  const submit = async () => {
    if (!collection) return null;

    deleteCollection.mutateAsync(collection.id as number);

    onClose();
    router.push("/collections");
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {permissions === true ? t("delete_collection") : t("leave_collection")}
      </p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        {permissions === true ? (
          <>
            {t("collection_deletion_prompt")}
            <div role="alert" className="alert alert-warning">
              <i className="bi-exclamation-triangle text-xl"></i>
              <span>
                <b>{t("warning")}: </b>
                {t("deletion_warning")}
              </span>
            </div>
          </>
        ) : (
          <p>{t("leave_prompt")}</p>
        )}

        <Button onClick={submit} variant="destructive" className="ml-auto">
          <i className="bi-trash text-xl"></i>
          {permissions === true ? t("delete") : t("leave")}
        </Button>
      </div>
    </Modal>
  );
}
