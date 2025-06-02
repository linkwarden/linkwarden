import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { useDeleteCollection } from "@linkwarden/router/collections";
import toast from "react-hot-toast";

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
  const [submitLoader, setSubmitLoader] = useState(false);
  const router = useRouter();
  const permissions = usePermissions(collection.id as number);

  useEffect(() => {
    setCollection(activeCollection);
  }, []);

  const deleteCollection = useDeleteCollection();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading(t("deleting_collection"));

      deleteCollection.mutateAsync(collection.id as number, {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            onClose();
            toast.success(t("deleted"));
            router.push("/collections");
          }
        },
      });
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {permissions === true ? t("delete_collection") : t("leave_collection")}
      </p>

      <div className="divider mb-3 mt-1"></div>

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
