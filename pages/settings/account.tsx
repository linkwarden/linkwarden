import { useState, useEffect, ChangeEvent } from "react";
import { AccountSettings } from "@/types/global";
import { toast } from "react-hot-toast";
import SettingsLayout from "@/layouts/SettingsLayout";
import TextInput from "@/components/TextInput";
import { resizeImage } from "@/lib/client/resizeImage";
import ProfilePhoto from "@/components/ProfilePhoto";
import SubmitButton from "@/components/SubmitButton";
import React from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import { dropdownTriggerer } from "@/lib/client/utils";
import EmailChangeVerificationModal from "@/components/ModalContent/EmailChangeVerificationModal";
import Button from "@/components/ui/Button";
import { i18n } from "next-i18next.config";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useUpdateUser, useUser } from "@/hooks/store/user";
import { z } from "zod";
import ImportDropdown from "@/components/ImportDropdown";
import { useConfig } from "@/hooks/store/config";

export default function Account() {
  const [emailChangeVerificationModal, setEmailChangeVerificationModal] =
    useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const { data: account } = useUser();
  const updateUser = useUpdateUser();
  const [user, setUser] = useState<AccountSettings>(
    account.id
      ? account
      : ({
          // @ts-ignore
          id: null,
          name: "",
          username: "",
          email: "",
          emailVerified: null,
          password: undefined,
          image: "",
          isPrivate: false,
          // @ts-ignore
          createdAt: null,
          whitelistedUsers: [],
        } as unknown as AccountSettings)
  );

  const { data: config } = useConfig();

  const { t } = useTranslation();

  const [whitelistedUsersTextbox, setWhiteListedUsersTextbox] = useState("");

  useEffect(() => {
    if (!account.id) return;

    setUser({
      ...account,
      whitelistedUsers: stringToArray(whitelistedUsersTextbox),
    });
  }, [account, whitelistedUsersTextbox]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return toast.error(t("image_upload_no_file_error"));

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpeg", "jpg"];
    if (allowedExtensions.includes(fileExtension as string)) {
      const resizedFile = await resizeImage(file);
      if (
        resizedFile.size < 1048576 // 1048576 Bytes == 1MB
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          setUser({ ...user, image: reader.result as string });
        };
        reader.readAsDataURL(resizedFile);
      } else {
        toast.error(t("image_upload_size_error"));
      }
    } else {
      toast.error(t("image_upload_format_error"));
    }
  };

  const submit = async (password?: string) => {
    if (!/^[a-z0-9_-]{3,50}$/.test(user.username || "")) {
      return toast.error(t("username_invalid_guide"));
    }

    const emailSchema = z.string().trim().email().toLowerCase();
    const emailValidation = emailSchema.safeParse(user.email || "");
    if (config?.EMAIL_PROVIDER && !emailValidation.success) {
      return toast.error(t("email_invalid"));
    }

    setSubmitLoader(true);

    const load = toast.loading(t("applying_settings"));

    await updateUser.mutateAsync(
      {
        ...user,
        password: password ? password : undefined,
      },
      {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            if (data.response.email !== user.email) {
              toast.success(t("email_change_request"));
              setEmailChangeVerificationModal(false);
            }

            toast.success(t("settings_applied"));
          }
        },
      }
    );

    if (user.locale !== account.locale) {
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  };

  useEffect(() => {
    setWhiteListedUsersTextbox(account?.whitelistedUsers?.join(", "));
  }, [account]);

  const stringToArray = (str: string) => {
    return str?.replace(/\s+/g, "").split(",");
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("accountSettings")}
      </p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2">{t("display_name")}</p>
              <TextInput
                value={user.name || ""}
                className="bg-base-200"
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div>
              <p className="mb-2">{t("username")}</p>
              <TextInput
                value={user.username || ""}
                className="bg-base-200"
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </div>
            {config?.EMAIL_PROVIDER && (
              <div>
                <p className="mb-2">{t("email")}</p>
                <TextInput
                  value={user.email || ""}
                  type="email"
                  className="bg-base-200"
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
            )}
            <div>
              <p className="mb-2">{t("language")}</p>
              <select
                value={user.locale || ""}
                onChange={(e) => {
                  setUser({ ...user, locale: e.target.value });
                }}
                className="select border border-neutral-content focus:outline-none focus:border-primary duration-100 w-full bg-base-200 rounded-[0.375rem] min-h-0 h-[2.625rem] leading-4 p-2"
              >
                {i18n.locales.map((locale) => (
                  <option key={locale} value={locale} className="capitalize">
                    {new Intl.DisplayNames(locale, { type: "language" }).of(
                      locale
                    ) || ""}
                  </option>
                ))}
                <option disabled>{t("more_coming_soon")}</option>
              </select>
            </div>
          </div>

          <div className="sm:row-span-2 sm:justify-self-center my-3">
            <p className="mb-2 sm:text-center">{t("profile_photo")}</p>
            <div className="w-28 h-28 flex gap-3 sm:flex-col items-center">
              <ProfilePhoto
                priority={true}
                src={user.image ? user.image : undefined}
                large={true}
              />

              <div className="dropdown dropdown-bottom">
                <Button
                  tabIndex={0}
                  role="button"
                  size="small"
                  intent="secondary"
                  onMouseDown={dropdownTriggerer}
                  className="text-sm"
                >
                  <i className="bi-pencil-square text-md duration-100"></i>
                  {t("edit")}
                </Button>
                <ul className="shadow menu dropdown-content z-[1] bg-base-200 border border-neutral-content rounded-box mt-1">
                  <li>
                    <label
                      tabIndex={0}
                      role="button"
                      className="whitespace-nowrap"
                    >
                      {t("upload_new_photo")}
                      <input
                        type="file"
                        name="photo"
                        id="upload-photo"
                        accept=".png, .jpeg, .jpg"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </li>
                  {user.image && (
                    <li>
                      <div
                        tabIndex={0}
                        role="button"
                        onClick={() =>
                          setUser({
                            ...user,
                            image: "",
                          })
                        }
                        className="whitespace-nowrap"
                      >
                        {t("remove_photo")}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:-mt-3">
          <Checkbox
            label={t("make_profile_private")}
            state={user.isPrivate}
            onClick={() => setUser({ ...user, isPrivate: !user.isPrivate })}
          />

          <p className="text-neutral text-sm">{t("profile_privacy_info")}</p>

          {user.isPrivate && (
            <div className="pl-5">
              <p className="mt-2">{t("whitelisted_users")}</p>
              <p className="text-neutral text-sm mb-3">
                {t("whitelisted_users_info")}
              </p>
              <textarea
                className="w-full resize-none border rounded-md duration-100 bg-base-200 p-2 outline-none border-neutral-content focus:border-primary"
                placeholder={t("whitelisted_users_placeholder")}
                value={whitelistedUsersTextbox}
                onChange={(e) => setWhiteListedUsersTextbox(e.target.value)}
              />
            </div>
          )}
        </div>

        <SubmitButton
          onClick={() => {
            if (account.email !== user.email) {
              setEmailChangeVerificationModal(true);
            } else {
              submit();
            }
          }}
          loading={submitLoader}
          label={t("save_changes")}
          className="mt-2 w-full sm:w-fit"
        />

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="truncate w-full pr-7 text-3xl font-thin">
              {t("import_export")}
            </p>
          </div>

          <div className="divider my-3"></div>

          <div className="flex gap-3 flex-col">
            <div>
              <p className="mb-2">{t("import_data")}</p>
              <ImportDropdown />
            </div>

            <div>
              <p className="mb-2">{t("download_data")}</p>
              <Link className="w-fit" href="/api/v1/migration">
                <div className="select-none relative duration-200 rounded-lg text-sm text-center w-fit flex justify-center items-center gap-2 disabled:pointer-events-none disabled:opacity-50 bg-neutral-content text-secondary-foreground hover:bg-neutral-content/80 border border-neutral/30 h-10 px-4 py-2">
                  <i className="bi-cloud-download text-xl duration-100"></i>
                  <p>{t("export_data")}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="text-red-500 dark:text-red-500 truncate w-full pr-7 text-3xl font-thin">
              {t("delete_account")}
            </p>
          </div>

          <div className="divider my-3"></div>

          <p>
            {t("delete_account_warning")}
            {process.env.NEXT_PUBLIC_STRIPE &&
              " " + t("cancel_subscription_notice")}
          </p>
        </div>

        <Link href="/settings/delete" className="underline">
          {t("account_deletion_page")}
        </Link>
      </div>

      {emailChangeVerificationModal && (
        <EmailChangeVerificationModal
          onClose={() => setEmailChangeVerificationModal(false)}
          onSubmit={submit}
          oldEmail={account.email || ""}
          newEmail={user.email || ""}
        />
      )}
    </SettingsLayout>
  );
}

export { getServerSideProps };
