import SettingsLayout from "@/layouts/SettingsLayout";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useEffect, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinkArchiveActionSchemaType } from "@linkwarden/lib/schemaValidation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface WorkerStats {
  totalLinks: number;
  archival: {
    preserved: number;
    remaining: number;
    percent: number;
  };
};

const useWorkerStats = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["worker-stats"],
    queryFn: async () => {
      const response = await fetch("/api/v1/links/archive");
      if (!response.ok) throw new Error("Failed to fetch worker statistics.");

      const data = await response.json();
      return data.stats as WorkerStats;
    },
    enabled: status === "authenticated",
    refetchInterval: 10000
  });
}

const useArchiveAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: LinkArchiveActionSchemaType) => {
      const response = await fetch("/api/v1/links/archive", {
        body: JSON.stringify({ action: action }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", "worker-stats"] });
    },
  });
};

export default function Worker() {
  const { t } = useTranslation();
  const { data: workerStatistics } = useWorkerStats();
  const archiveAction = useArchiveAction();
  const [showModal, setShowModal] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [action, setAction] = useState<
    LinkArchiveActionSchemaType | undefined
  >();

  useEffect(() => {
    if (showModal === false) {
      setAction(undefined);
    }
  }, [showModal]);

  const submit = async (action: LinkArchiveActionSchemaType) => {
    if (!action || submitLoader) return;
    setSubmitLoader(true);

    const load = toast.loading(t("deleting"));

    await archiveAction.mutateAsync(action, {
      onSettled: (data, error) => {
        setSubmitLoader(false);
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          if (action === "allAndIgnore") {
            toast.success(t("deleted"));
          } else {
            toast.success(t("links_are_being_represerved"));
          }
        }
      },
    });
  };

  console.log(workerStatistics, "workerStatistics");

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">{t("worker")}</p>

      <div className="divider my-3"></div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("worker_statistics")}</h2>

        <div className="bg-base-200 rounded-lg p-4">
          {workerStatistics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="stat bg-base-100 rounded-lg shadow">
                  <div className="stat-title">{t("total_links")}</div>
                  <div className="stat-value">{workerStatistics.totalLinks}</div>
                </div>

                <div className="stat bg-base-100 rounded-lg shadow">
                  <div className="stat-title">{t("preserved_links")}</div>
                  <div className="stat-value">{workerStatistics.archival.preserved}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-base-300 rounded-full h-2.5 tooltip tooltip-top" data-tip={`${workerStatistics.archival.percent}%`}>
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${workerStatistics.archival.percent}%` }}
                  ></div>
                </div>
              </div>
            </>

          ) : (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col gap-6 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("regenerate_broken_preservations")}</span>
          <button
            onClick={() => submit("allBroken")}
            className={`btn btn-sm ml-auto btn-accent dark:border-violet-400 text-white tracking-wider w-fit flex items-center gap-2`}
          >
            {t("confirm")}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("delete_all_preservations_and_regenerate")}</span>
          <button
            className={`btn btn-sm ml-auto btn-error text-white tracking-wider w-fit flex items-center gap-2`}
            onClick={() => {
              setAction("allAndRePreserve");
              setShowModal(true);
            }}
          >
            {t("confirm")}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("delete_all_preservations")}</span>
          <button
            className={`btn btn-sm ml-auto btn-error text-white tracking-wider w-fit flex items-center gap-2`}
            onClick={() => {
              setAction("allAndIgnore");
              setShowModal(true);
            }}
          >
            {t("confirm")}
          </button>
        </div>
      </div>
      {showModal && action && (
        <ConfirmationModal
          title={
            action === "allAndIgnore"
              ? t("delete_all_preservations")
              : t("delete_all_preservations_and_regenerate")
          }
          onConfirmed={() => submit(action)}
          toggleModal={setShowModal}
        >
          <p>{t("delete_all_preservation_warning")}</p>
          <div role="alert" className="alert alert-warning mt-3">
            <i className="bi-exclamation-triangle text-xl" />
            <span>
              <b>{t("warning")}:</b> {t("irreversible_action_warning")}
            </span>
          </div>
        </ConfirmationModal>
      )}
    </SettingsLayout>
  );
}

export { getServerSideProps };
