import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";
import { RssSubscription } from "@prisma/client";
import { useDeleteRssSubscription } from "@/hooks/store/rss";

type Props = {
  onClose: Function;
  rssSubscription: RssSubscription;
};

export default function DeleteRssSubscriptionModal({
  onClose,
  rssSubscription,
}: Props) {
  const { t } = useTranslation();
  const [subscription, setSubscription] =
    useState<RssSubscription>(rssSubscription);
  const deleteRssSubscription = useDeleteRssSubscription();

  useEffect(() => {
    setSubscription(rssSubscription);
  }, []);

  const submit = async () => {
    const load = toast.loading(t("deleting"));

    await deleteRssSubscription.mutateAsync(subscription.id, {
      onSettled: (_, error) => {
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          onClose();
          toast.success(t("rss_subscription_deleted"));
        }
      },
    });
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_link")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>{t("rss_deletion_confirmation")}</p>

        <Button className="ml-auto" intent="destructive" onClick={submit}>
          <i className="bi-trash text-xl" />
          {t("delete")}
        </Button>
      </div>
    </Modal>
  );
}
