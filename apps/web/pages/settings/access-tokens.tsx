import SettingsLayout from "@/layouts/SettingsLayout";
import React, { useState } from "react";
import NewTokenModal from "@/components/ModalContent/NewTokenModal";
import RevokeTokenModal from "@/components/ModalContent/RevokeTokenModal";
import { AccessToken } from "@linkwarden/prisma/client";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTokens } from "@linkwarden/router/tokens";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export default function AccessTokens() {
  const [newTokenModal, setNewTokenModal] = useState(false);
  const [revokeTokenModal, setRevokeTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<AccessToken | null>(null);
  const { t } = useTranslation();

  const openRevokeModal = (token: AccessToken) => {
    setSelectedToken(token);
    setRevokeTokenModal(true);
  };

  const { data: tokens = [] } = useTokens();

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("access_tokens")}
      </p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>{t("access_tokens_description")}</p>

        <Button
          className="ml-auto"
          variant="accent"
          onClick={() => {
            setNewTokenModal(true);
          }}
        >
          {t("new_token")}
        </Button>

        {tokens.length > 0 && (
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger> {token.name}</TooltipTrigger>
                            <TooltipContent>
                              <p>{t("permanent_session")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        token.name
                      )}
                    </td>
                    <td>
                      {new Date(token.createdAt).toLocaleDateString(
                        t("locale"),
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td>
                      {new Date(token.expires).toLocaleDateString(t("locale"), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-error"
                        onClick={() => openRevokeModal(token as AccessToken)}
                      >
                        <i className="bi-x text-lg"></i>
                      </Button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {newTokenModal && (
        <NewTokenModal onClose={() => setNewTokenModal(false)} />
      )}
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
