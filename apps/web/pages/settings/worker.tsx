import SettingsLayout from "@/layouts/SettingsLayout";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useEffect, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { LinkArchiveActionSchemaType } from "@linkwarden/lib/schemaValidation";
import toast from "react-hot-toast";
import { useArchiveAction } from "@linkwarden/router/links";
import { Button } from "@/components/ui/button";

export default function Worker() {
  const { t } = useTranslation();
  const archiveAction = useArchiveAction();
  const [showModal, setShowModal] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [action, setAction] = useState<
    LinkArchiveActionSchemaType["action"] | undefined
  >();

  useEffect(() => {
    if (showModal === false) {
      setAction(undefined);
    }
  }, [showModal]);

  const submit = async (action: LinkArchiveActionSchemaType["action"]) => {
    if (!action || submitLoader) return;
    setSubmitLoader(true);

    const load = toast.loading(t("deleting"));

    await archiveAction.mutateAsync(
      { action },
      {
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
      }
    );
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">{t("worker")}</p>

      <div className="divider my-3"></div>

      <div className="w-full flex flex-col gap-6 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("regenerate_broken_preservations")}</span>
          <Button
            onClick={() => submit("allBroken")}
            className="ml-auto"
            variant="primary"
          >
            {t("confirm")}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("delete_all_preservations_and_regenerate")}</span>
          <Button
            className="ml-auto"
            variant="destructive"
            onClick={() => {
              setAction("allAndRePreserve");
              setShowModal(true);
            }}
          >
            {t("confirm")}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>{t("delete_all_preservations")}</span>
          <Button
            className="ml-auto"
            variant="destructive"
            onClick={() => {
              setAction("allAndIgnore");
              setShowModal(true);
            }}
          >
            {t("confirm")}
          </Button>
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
