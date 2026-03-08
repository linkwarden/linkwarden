import AdminLayout from "@/layouts/AdminLayout";
import { Trans, useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { ReactElement, useEffect, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { DeletePreservationsSchemaType } from "@linkwarden/lib/schemaValidation";
import toast from "react-hot-toast";
import { useDeletePreservations, useWorker } from "@linkwarden/router/worker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NextPageWithLayout } from "../_app";
import { useConfig } from "@linkwarden/router/config";
import { useUser } from "@linkwarden/router/user";
import { useRouter } from "next/router";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const deletePreservations = useDeletePreservations();
  const workerStats = useWorker();
  const [showModal, setShowModal] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [action, setAction] = useState<
    DeletePreservationsSchemaType["action"] | undefined
  >();

  const { data: config } = useConfig();
  const { data: user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (config && user && user?.id !== (config?.ADMIN || 1)) {
      console.log(config, user);
      router.replace("/dashboard");
    }
  }, [config, user]);

  useEffect(() => {
    if (showModal === false) {
      setAction(undefined);
    }
  }, [showModal]);

  const submit = async (action: DeletePreservationsSchemaType["action"]) => {
    if (!action || submitLoader) return;
    setSubmitLoader(true);

    const load = toast.loading(t("deleting"));

    await deletePreservations.mutateAsync(
      { action },
      {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success(t("links_are_being_represerved"));
          }
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <i className="bi-gear-wide-connected text-primary text-2xl"></i>
        <p className="capitalize text-3xl font-thin inline">
          {t("background_jobs")}
        </p>
      </div>

      <Separator className="my-3" />

      <p>{t("background_jobs_desc")}</p>

      <div className="flex items-center gap-2 my-3">
        <p className="capitalize text-2xl font-thin inline">
          {t("link_preservation_job")}
        </p>
      </div>

      <Separator className="my-3" />

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start">
        <div>
          <p>{t("link_preservation_job_desc")}</p>
          <div className="mt-3 flex gap-3">
            <div className="flex gap-1 border border-warning bg-warning/20 rounded-md px-2 py-1 w-max">
              <i className="bi-hourglass-split text-warning text-xl" />
              <p>{workerStats.data?.link.pending}</p>
              <p>{t("pending")}</p>
            </div>

            <div className="flex gap-1 border border-success bg-success/20 rounded-md px-2 py-1 w-max">
              <i className="bi-check2 text-success text-xl" />
              <p>{workerStats.data?.link.done}</p>
              <p>{t("done")}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-col">
          <Button
            onClick={() => {
              setAction("allBroken");
              setShowModal(true);
            }}
            variant="metal"
          >
            {t("regenerate_broken_links")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setAction("allAndRePreserve");
              setShowModal(true);
            }}
          >
            {t("regenerate_all_links")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 my-3">
        <p className="capitalize text-2xl font-thin inline">
          {t("search_indexing_job")}
        </p>
      </div>

      <Separator className="my-3" />

      <p>{t("search_indexing_job_desc")}</p>

      <p>{t("worker_pending_indexing_desc")}</p>

      <div className="mt-3 flex gap-3">
        <div className="flex gap-1 border border-warning bg-warning/20 rounded-md px-2 py-1 w-max">
          <i className="bi-hourglass-split text-warning text-xl" />
          <p>{workerStats.data?.search.pending}</p>
          <p>{t("pending")}</p>
        </div>

        <div className="flex gap-1 border border-success bg-success/20 rounded-md px-2 py-1 w-max">
          <i className="bi-check2 text-success text-xl" />
          <p>{workerStats.data?.search.done}</p>
          <p>{t("done")}</p>
        </div>
      </div>

      {showModal && action === "allBroken" && (
        <ConfirmationModal
          title={t("regenerate_broken_links")}
          onConfirmed={() => submit(action)}
          toggleModal={setShowModal}
        >
          <ul className="px-5 list-disc">
            <Trans
              i18nKey="regenerate_broken_preserved_content_desc"
              components={[<li key={0} />]}
              values={{
                count: workerStats.data?.link.failed,
              }}
            />
          </ul>
          <div role="alert" className="alert alert-warning mt-3">
            <i className="bi-exclamation-triangle text-xl" />
            <span>
              <b>{t("warning")}:</b> {t("irreversible_action_warning")}
            </span>
          </div>
        </ConfirmationModal>
      )}
      {showModal && action === "allAndRePreserve" && (
        <ConfirmationModal
          title={t("regenerate_all_links")}
          onConfirmed={() => submit(action)}
          toggleModal={setShowModal}
        >
          <ul className="px-5 list-disc">
            <Trans
              i18nKey="delete_all_preserved_content_and_regenerate_desc"
              components={[<li key={0} />]}
            />
          </ul>
          <div role="alert" className="alert alert-warning mt-3">
            <i className="bi-exclamation-triangle text-xl" />
            <span>
              <b>{t("warning")}:</b> {t("irreversible_action_warning")}
            </span>
          </div>
        </ConfirmationModal>
      )}
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement<any>) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Page;

export { getServerSideProps };
