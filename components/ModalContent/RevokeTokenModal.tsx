import React, { useEffect, useState } from "react";
import useTokenStore from "@/store/tokens";
import toast from "react-hot-toast";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";
import { AccessToken } from "@prisma/client";

type Props = {
  onClose: Function;
  activeToken: AccessToken;
};

export default function DeleteTokenModal({ onClose, activeToken }: Props) {
  const { t } = useTranslation();
  const [token, setToken] = useState<AccessToken>(activeToken);

  const { revokeToken } = useTokenStore();

  useEffect(() => {
    setToken(activeToken);
  }, [activeToken]);

  const deleteLink = async () => {
    const load = toast.loading(t("deleting"));

    const response = await revokeToken(token.id as number);

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("token_revoked"));
    } else {
      toast.error(response.data as string);
    }

    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("revoke_token")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>{t("revoke_confirmation")}</p>

        <Button className="ml-auto" intent="destructive" onClick={deleteLink}>
          <i className="bi-trash text-xl" />
          {t("revoke")}
        </Button>
      </div>
    </Modal>
  );
}
