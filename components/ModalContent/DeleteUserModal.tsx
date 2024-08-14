import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";
import { useDeleteUser } from "@/hooks/store/admin/users";
import { useState } from "react";

type Props = {
  onClose: Function;
  userId: number;
};

export default function DeleteUserModal({ onClose, userId }: Props) {
  const { t } = useTranslation();

  const [submitLoader, setSubmitLoader] = useState(false);
  const deleteUser = useDeleteUser();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      await deleteUser.mutateAsync(userId, {
        onSuccess: () => {
          onClose();
        },
      });

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_user")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>{t("confirm_user_deletion")}</p>

        <div role="alert" className="alert alert-warning">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <b>{t("warning")}:</b> {t("irreversible_action_warning")}
          </span>
        </div>

        <Button className="ml-auto" intent="destructive" onClick={submit}>
          <i className="bi-trash text-xl" />
          {t("delete_confirmation")}
        </Button>
      </div>
    </Modal>
  );
}
