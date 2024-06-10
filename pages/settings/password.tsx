import SettingsLayout from "@/layouts/SettingsLayout";
import { useState } from "react";
import useAccountStore from "@/store/account";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function Password() {
  const { t } = useTranslation();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitLoader, setSubmitLoader] = useState(false);
  const { account, updateAccount } = useAccountStore();

  const submit = async () => {
    if (newPassword === "" || oldPassword === "") {
      return toast.error(t("fill_all_fields"));
    }
    if (newPassword.length < 8) return toast.error(t("password_length_error"));

    setSubmitLoader(true);

    const load = toast.loading(t("applying_changes"));

    const response = await updateAccount({
      ...account,
      newPassword,
      oldPassword,
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("settings_applied"));
      setNewPassword("");
      setOldPassword("");
    } else {
      toast.error(response.data as string);
    }

    setSubmitLoader(false);
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("change_password")}
      </p>

      <div className="divider my-3"></div>

      <p className="mb-3">{t("password_change_instructions")}</p>
      <div className="w-full flex flex-col gap-2 justify-between">
        <p>{t("old_password")}</p>

        <TextInput
          value={oldPassword}
          className="bg-base-200"
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="••••••••••••••"
          type="password"
        />

        <p className="mt-3">{t("new_password")}</p>

        <TextInput
          value={newPassword}
          className="bg-base-200"
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••••••••"
          type="password"
        />

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label={t("save_changes")}
          className="mt-3 w-full sm:w-fit"
        />
      </div>
    </SettingsLayout>
  );
}

export { getServerSideProps };
