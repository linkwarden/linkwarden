import SettingsLayout from "@/layouts/SettingsLayout";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useRssSubscriptions } from "@/hooks/store/rss";
import DeleteRssSubscriptionModal from "@/components/ModalContent/DeleteRssSubscriptionModal";
import { useState } from "react";
import { RssSubscription } from "@prisma/client";
import NewRssSubscriptionModal from "@/components/ModalContent/NewRssSubscriptionModal";
import Link from "next/link";
import { useConfig } from "@/hooks/store/config";

export default function RssSubscriptions() {
  const { t } = useTranslation();
  const { data: rssSubscriptions = [] } = useRssSubscriptions();

  const [deleteSubscriptionModal, setDeleteSubscriptionModal] = useState(false);
  const [newSubscriptionModal, setNewSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<RssSubscription | null>(null);

  const openDeleteModal = (subscription: RssSubscription) => {
    setSelectedSubscription(subscription);
    setDeleteSubscriptionModal(true);
  };

  const { data: config } = useConfig();

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("rss_subscriptions")}
      </p>

      <div className="divider my-3"></div>
      <div className="flex flex-col gap-3">
        <p>
          {t("rss_subscriptions_desc", {
            number: config?.RSS_POLLING_INTERVAL_MINUTES || 60,
          })}
        </p>

        <button
          className={`btn ml-auto btn-accent dark:border-violet-400 text-white tracking-wider w-fit flex items-center gap-2`}
          onClick={() => {
            setNewSubscriptionModal(true);
          }}
        >
          {t("new_rss_subscription")}
        </button>
        {rssSubscriptions.length > 0 && (
          <table className="table mt-2 overflow-x-auto">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("link")}</th>
                <th>{t("collection")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rssSubscriptions.map((rssSubscription, i) => (
                <tr key={i}>
                  <td>{rssSubscription.name}</td>
                  <td>{rssSubscription.url}</td>
                  <td>{rssSubscription.collection.name}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost btn-square hover:bg-red-500"
                      onClick={() => openDeleteModal(rssSubscription)}
                    >
                      <i className="bi-x text-lg"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {newSubscriptionModal && (
        <NewRssSubscriptionModal
          onClose={() => setNewSubscriptionModal(false)}
        />
      )}
      {deleteSubscriptionModal && selectedSubscription && (
        <DeleteRssSubscriptionModal
          rssSubscription={selectedSubscription}
          onClose={() => {
            setDeleteSubscriptionModal(false);
            setSelectedSubscription(null);
          }}
        />
      )}
    </SettingsLayout>
  );
}

export { getServerSideProps };
