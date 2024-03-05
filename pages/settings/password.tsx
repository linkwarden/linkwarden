import SettingsLayout from "@/layouts/SettingsLayout";
import { useState } from "react";
import useAccountStore from "@/store/account";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";

export default function Password() {
  const [newPassword, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [submitLoader, setSubmitLoader] = useState(false);

  const { account, updateAccount } = useAccountStore();

  const submit = async () => {
    if (newPassword == "" || newPassword2 == "") {
      return toast.error("Please fill all the fields.");
    }

    if (newPassword !== newPassword2)
      return toast.error("Passwords do not match.");
    else if (newPassword.length < 8)
      return toast.error("Passwords must be at least 8 characters.");

    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    const response = await updateAccount({
      ...account,
      newPassword,
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Settings Applied!");
      setNewPassword1("");
      setNewPassword2("");
    } else toast.error(response.data as string);

    setSubmitLoader(false);
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">Change Password</p>

      <div className="divider my-3"></div>

      <p className="mb-3">
        To change your password, please fill out the following. Your password
        should be at least 8 characters.
      </p>
      <div className="w-full flex flex-col gap-2 justify-between">
        <p>New Password</p>

        <TextInput
          value={newPassword}
          className="bg-base-200"
          onChange={(e) => setNewPassword1(e.target.value)}
          placeholder="••••••••••••••"
          type="password"
        />

        <p>Confirm New Password</p>

        <TextInput
          value={newPassword2}
          className="bg-base-200"
          onChange={(e) => setNewPassword2(e.target.value)}
          placeholder="••••••••••••••"
          type="password"
        />

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label="Save Changes"
          className="mt-2 w-full sm:w-fit"
        />
      </div>
    </SettingsLayout>
  );
}
