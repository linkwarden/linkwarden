import React, { useLayoutEffect, useRef, useState } from "react";
import TextInput from "@/components/TextInput";
import { TokenExpiry } from "@linkwarden/types";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { useAddToken } from "@linkwarden/router/tokens";
import CopyButton from "../CopyButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";
import useWindowDimensions from "@/hooks/useWindowDimensions";

type Props = {
  onClose: Function;
};

export default function NewTokenModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [newToken, setNewToken] = useState("");
  const addToken = useAddToken();

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

      await addToken.mutateAsync(token, {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            setNewToken(data.secretKey);
          }
        },
      });
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

  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Modal toggleModal={onClose}>
      {newToken ? (
        <div className="flex flex-col justify-center space-y-4">
          <p className="text-xl font-thin">{t("access_token_created")}</p>
          <p>{t("token_creation_notice")}</p>
          <div className="relative">
            <div className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-2 bg-base-200 border-neutral-content border-solid border flex items-center gap-2 justify-between pr-14">
              {newToken}
              <div className="absolute right-0 px-2 border-neutral-content border-solid border-r bg-base-200">
                <CopyButton text={newToken} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl font-thin">{t("create_access_token")}</p>

          <Separator className="my-3" />

          <div className="flex sm:flex-row flex-col gap-2 items-center">
            <div className="w-full">
              <p className="mb-2">{t("name")}</p>

              <TextInput
                ref={inputRef}
                value={token.name}
                onChange={(e) => setToken({ ...token, name: e.target.value })}
                placeholder={t("token_name_placeholder")}
                className="bg-base-200"
              />
            </div>

            <div className="w-full sm:w-fit">
              <p className="mb-2">{t("expires_in")}</p>

              {width < 640 ? (
                <select
                  aria-label={t("expires_in")}
                  className="w-full rounded-md p-2 border-neutral-content border-solid border outline-none focus:border-primary duration-100 bg-base-200 h-10"
                  value={token.expires}
                  onChange={(e) =>
                    setToken({
                      ...token,
                      expires: Number(e.target.value),
                    })
                  }
                >
                  <option value={TokenExpiry.sevenDays}>{t("7_days")}</option>
                  <option value={TokenExpiry.oneMonth}>{t("30_days")}</option>
                  <option value={TokenExpiry.twoMonths}>{t("60_days")}</option>
                  <option value={TokenExpiry.threeMonths}>{t("90_days")}</option>
                  <option value={TokenExpiry.never}>{t("no_expiration")}</option>
                </select>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="metal" className="whitespace-nowrap w-32">
                      {getLabel(token.expires)}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={token.expires.toString()}
                      onValueChange={(e) =>
                        setToken({
                          ...token,
                          expires: Number(e),
                        })
                      }
                    >
                      <DropdownMenuRadioItem
                        value={TokenExpiry.sevenDays.toString()}
                      >
                        {t("7_days")}
                      </DropdownMenuRadioItem>

                      <DropdownMenuRadioItem
                        value={TokenExpiry.oneMonth.toString()}
                      >
                        {t("30_days")}
                      </DropdownMenuRadioItem>

                      <DropdownMenuRadioItem
                        value={TokenExpiry.twoMonths.toString()}
                      >
                        {t("60_days")}
                      </DropdownMenuRadioItem>

                      <DropdownMenuRadioItem
                        value={TokenExpiry.threeMonths.toString()}
                      >
                        {t("90_days")}
                      </DropdownMenuRadioItem>

                      <DropdownMenuRadioItem
                        value={TokenExpiry.never.toString()}
                      >
                        {t("no_expiration")}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex justify-end items-center mt-5">
            <Button variant="accent" onClick={submit}>
              {t("create_token")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
