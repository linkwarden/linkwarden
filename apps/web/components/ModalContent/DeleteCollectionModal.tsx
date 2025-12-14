import React, { useEffect, useState } from "react";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { useDeleteCollection } from "@linkwarden/router/collections";
import toast from "react-hot-toast";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type Props = {
  activeCollection: CollectionIncludingMembersAndLinkCount;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteCollectionModal({
  activeCollection,
  children,
  onOpenChange,
  open,
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
            onOpenChange(false);
            toast.success(t("deleted"));
            router.push("/collections");
          }
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent aria-describedby="delete-collection-prompt">
        <DialogHeader className="text-xl font-thin text-red-500">
          <DialogTitle>
            {permissions === true
              ? t("delete_collection")
              : t("leave_collection")}
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-3" aria-hidden="true" />

        <div className="flex flex-col gap-3">
          {permissions === true ? (
            <div id="delete-collection-prompt">
              {t("collection_deletion_prompt")}
              <div className="alert alert-warning">
                <i
                  className="bi-exclamation-triangle text-xl"
                  aria-hidden="true"
                ></i>
                <span>
                  <b>{t("warning")}: </b>
                  {t("deletion_warning")}
                </span>
              </div>
            </div>
          ) : (
            <p>{t("leave_prompt")}</p>
          )}

          <Button
            onClick={submit}
            variant="destructive"
            className="ml-auto"
            aria-label={
              permissions === true
                ? t("delete_collection")
                : t("leave_collection")
            }
          >
            <i className="bi-trash text-xl"></i>
            {permissions === true ? t("delete") : t("leave")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
