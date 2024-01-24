import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useRouter } from "next/router";
import { AccessToken } from "@prisma/client";
import useTokenStore from "@/store/tokens";

type Props = {
  onClose: Function;
  activeToken: AccessToken;
};

export default function DeleteTokenModal({ onClose, activeToken }: Props) {
  const [token, setToken] = useState<AccessToken>(activeToken);

  const { revokeToken } = useTokenStore();
  const [submitLoader, setSubmitLoader] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setToken(activeToken);
  }, []);

  const deleteLink = async () => {
    console.log(token);
    const load = toast.loading("Deleting...");

    const response = await revokeToken(token.id as number);

    toast.dismiss(load);

    response.ok && toast.success(`Token Revoked.`);

    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">Revoke Token</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>
          Are you sure you want to revoke this Access Token? Any apps or
          services using this token will no longer be able to access Linkwarden
          using it.
        </p>

        <button
          className={`ml-auto btn w-fit text-white flex items-center gap-2 duration-100 bg-red-500 hover:bg-red-400 hover:dark:bg-red-600 cursor-pointer`}
          onClick={deleteLink}
        >
          <i className="bi-trash text-xl" />
          Revoke
        </button>
      </div>
    </Modal>
  );
}
