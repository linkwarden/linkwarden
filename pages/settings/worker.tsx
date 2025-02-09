import SettingsLayout from "@/layouts/SettingsLayout";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useEffect, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinkArchiveActionSchemaType } from "@/lib/shared/schemaValidation";
import toast from "react-hot-toast";

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
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
};

export default function Worker() {
  const { t } = useTranslation();
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

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">{t("worker")}</p>

      <div className="divider my-3"></div>

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
