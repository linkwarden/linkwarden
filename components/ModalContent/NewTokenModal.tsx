import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import { TokenExpiry } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";
import useTokenStore from "@/store/tokens";
import { dropdownTriggerer } from "@/lib/client/utils";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
};

export default function NewTokenModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [newToken, setNewToken] = useState("");
  const { addToken } = useTokenStore();

  const initial = {
    name: "",
    expires: 0 as TokenExpiry,
  };

  const [token, setToken] = useState(initial as any);
  const [submitLoader, setSubmitLoader] = useState(false);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      const load = toast.loading(t("creating_token"));

      const { ok, data } = await addToken(token);

      toast.dismiss(load);

      if (ok) {
        toast.success(t("token_created"));
        setNewToken((data as any).secretKey);
      } else toast.error(data as string);

      setSubmitLoader(false);
    }
  };

  const getLabel = (expiry: TokenExpiry) => {
    switch (expiry) {
      case TokenExpiry.sevenDays:
        return t("7_days");
      case TokenExpiry.oneMonth:
        return t("30_days");
      case TokenExpiry.twoMonths:
        return t("60_days");
      case TokenExpiry.threeMonths:
        return t("90_days");
      case TokenExpiry.never:
        return t("no_expiration");
    }
  };

  return (
    <Modal toggleModal={onClose}>
      {newToken ? (
        <div className="flex flex-col justify-center space-y-4">
          <p className="text-xl font-thin">{t("access_token_created")}</p>
          <p>{t("token_creation_notice")}</p>
          <TextInput
            spellCheck={false}
            value={newToken}
            onChange={() => {}}
            className="w-full"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(newToken);
              toast.success(t("copied_to_clipboard"));
            }}
            className="btn btn-primary w-fit mx-auto"
          >
            {t("copy_to_clipboard")}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xl font-thin">{t("create_access_token")}</p>

          <div className="divider mb-3 mt-1"></div>

          <div className="flex sm:flex-row flex-col gap-2 items-center">
            <div className="w-full">
              <p className="mb-2">{t("name")}</p>

              <TextInput
                value={token.name}
                onChange={(e) => setToken({ ...token, name: e.target.value })}
                placeholder={t("token_name_placeholder")}
                className="bg-base-200"
              />
            </div>

            <div className="w-full sm:w-fit">
              <p className="mb-2">{t("expires_in")}</p>

              <div className="dropdown dropdown-bottom dropdown-end w-full">
                <Button
                  tabIndex={0}
                  role="button"
                  intent="secondary"
                  onMouseDown={dropdownTriggerer}
                  className="whitespace-nowrap w-32"
                >
                  {getLabel(token.expires)}
                </Button>
                <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-xl w-full sm:w-52 mt-1">
                  <li>
                    <label
                      className="label cursor-pointer flex justify-start"
                      tabIndex={0}
                      role="button"
                    >
                      <input
                        type="radio"
                        name="sort-radio"
                        className="radio checked:bg-primary"
                        checked={token.expires === TokenExpiry.sevenDays}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.sevenDays,
                          });
                        }}
                      />
                      <span className="label-text">{t("7_days")}</span>
                    </label>
                  </li>
                  <li>
                    <label
                      className="label cursor-pointer flex justify-start"
                      tabIndex={0}
                      role="button"
                    >
                      <input
                        type="radio"
                        name="sort-radio"
                        className="radio checked:bg-primary"
                        checked={token.expires === TokenExpiry.oneMonth}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({ ...token, expires: TokenExpiry.oneMonth });
                        }}
                      />
                      <span className="label-text">{t("30_days")}</span>
                    </label>
                  </li>
                  <li>
                    <label
                      className="label cursor-pointer flex justify-start"
                      tabIndex={0}
                      role="button"
                    >
                      <input
                        type="radio"
                        name="sort-radio"
                        className="radio checked:bg-primary"
                        checked={token.expires === TokenExpiry.twoMonths}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.twoMonths,
                          });
                        }}
                      />
                      <span className="label-text">{t("60_days")}</span>
                    </label>
                  </li>
                  <li>
                    <label
                      className="label cursor-pointer flex justify-start"
                      tabIndex={0}
                      role="button"
                    >
                      <input
                        type="radio"
                        name="sort-radio"
                        className="radio checked:bg-primary"
                        checked={token.expires === TokenExpiry.threeMonths}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.threeMonths,
                          });
                        }}
                      />
                      <span className="label-text">{t("90_days")}</span>
                    </label>
                  </li>
                  <li>
                    <label
                      className="label cursor-pointer flex justify-start"
                      tabIndex={0}
                      role="button"
                    >
                      <input
                        type="radio"
                        name="sort-radio"
                        className="radio checked:bg-primary"
                        checked={token.expires === TokenExpiry.never}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({ ...token, expires: TokenExpiry.never });
                        }}
                      />
                      <span className="label-text">{t("no_expiration")}</span>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center mt-5">
            <button
              className="btn btn-accent dark:border-violet-400 text-white"
              onClick={submit}
            >
              {t("create_token")}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
