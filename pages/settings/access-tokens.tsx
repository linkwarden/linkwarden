import SettingsLayout from "@/layouts/SettingsLayout";
import React, { useState } from "react";
import NewKeyModal from "@/components/ModalContent/NewKeyModal";

export default function Api() {
  const [newKeyModal, setNewKeyModal] = useState(false);

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">API Keys</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-3">
        <p>
          Access Tokens can be used to access Linkwarden from other apps and
          services without giving away your Username and Password.
        </p>

        <button
          className={`btn btn-accent dark:border-violet-400 text-white tracking-wider w-fit flex items-center gap-2`}
          onClick={() => {
            setNewKeyModal(true);
          }}
        >
          New Access Token
        </button>
      </div>

      {newKeyModal ? (
        <NewKeyModal onClose={() => setNewKeyModal(false)} />
      ) : undefined}
    </SettingsLayout>
  );
}
