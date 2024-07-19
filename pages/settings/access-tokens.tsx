import SettingsLayout from "@/layouts/SettingsLayout";
import React, { useEffect, useState } from "react";
import NewTokenModal from "@/components/ModalContent/NewTokenModal";
import RevokeTokenModal from "@/components/ModalContent/RevokeTokenModal";
import { AccessToken } from "@prisma/client";
import useTokenStore from "@/store/tokens";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function AccessTokens() {
  const [newTokenModal, setNewTokenModal] = useState(false);
  const [revokeTokenModal, setRevokeTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<AccessToken | null>(null);
  const { t } = useTranslation();

  const openRevokeModal = (token: AccessToken) => {
    setSelectedToken(token);
    setRevokeTokenModal(true);
  };

  const { setTokens, tokens } = useTokenStore();

  useEffect(() => {
    fetch("/api/v1/tokens")
      .then((res) => res.json())
      .then((data) => {
        if (data.response) setTokens(data.response as AccessToken[]);
      });
  }, []);

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("access_tokens")}
      </p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-3">
        <p>{t("access_tokens_description")}</p>

        <button
          className={`btn ml-auto btn-accent dark:border-violet-400 text-white tracking-wider w-fit flex items-center gap-2`}
          onClick={() => {
            setNewTokenModal(true);
          }}
        >
          {t("new_token")}
        </button>

        {tokens.length > 0 ? (
          <table className="table mt-2 overflow-x-auto">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("created")}</th>
                <th>{t("expires")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td className={token.isSession ? "text-primary" : ""}>
                      {token.isSession ? (
                        <div
                          className="tooltip tooltip-right text-left"
                          data-tip="This is a permanent session"
                        >
                          {token.name}
                        </div>
                      ) : (
                        token.name
                      )}
                    </td>
                    <td>
                      {new Date(token.createdAt || "").toLocaleDateString()}
                    </td>
                    <td>
                      {new Date(token.expires || "").toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost btn-square hover:bg-red-500"
                        onClick={() => openRevokeModal(token as AccessToken)}
                      >
                        <i className="bi-x text-lg"></i>
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : undefined}
      </div>

      {newTokenModal ? (
        <NewTokenModal onClose={() => setNewTokenModal(false)} />
      ) : undefined}
      {revokeTokenModal && selectedToken && (
        <RevokeTokenModal
          onClose={() => {
            setRevokeTokenModal(false);
            setSelectedToken(null);
          }}
          activeToken={selectedToken}
        />
      )}
    </SettingsLayout>
  );
}

export { getServerSideProps };
