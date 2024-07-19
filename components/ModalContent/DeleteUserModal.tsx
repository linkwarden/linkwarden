import toast from "react-hot-toast";
import Modal from "../Modal";
import useUserStore from "@/store/admin/users";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
  userId: number;
};

export default function DeleteUserModal({ onClose, userId }: Props) {
  const { t } = useTranslation();
  const { removeUser } = useUserStore();

  const deleteUser = async () => {
    const load = toast.loading(t("deleting_user"));

    const response = await removeUser(userId);

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("user_deleted"));
    } else {
      toast.error(response.data as string);
    }

    onClose();
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

        <Button className="ml-auto" intent="destructive" onClick={deleteUser}>
          <i className="bi-trash text-xl" />
          {t("delete_confirmation")}
        </Button>
      </div>
    </Modal>
  );
}
