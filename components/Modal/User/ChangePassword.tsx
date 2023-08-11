import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AccountSettings } from "@/types/global";
import useAccountStore from "@/store/account";
import { signOut, useSession } from "next-auth/react";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";

type Props = {
  togglePasswordFormModal: Function;
  setUser: Dispatch<SetStateAction<AccountSettings>>;
  user: AccountSettings;
};

export default function ChangePassword({
  togglePasswordFormModal,
  setUser,
  user,
}: Props) {
  const [newPassword, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [submitLoader, setSubmitLoader] = useState(false);

  const { account, updateAccount } = useAccountStore();
  const { update, data } = useSession();

  useEffect(() => {
    if (
      !(newPassword == "" || newPassword2 == "") &&
      newPassword === newPassword2
    ) {
      setUser({ ...user, newPassword });
    }
  }, [newPassword, newPassword2]);

  const submit = async () => {
    if (newPassword == "" || newPassword2 == "") {
      toast.error("Please fill all the fields.");
    }

    if (newPassword !== newPassword2)
      return toast.error("Passwords do not match.");
    else if (newPassword.length < 8)
      return toast.error("Passwords must be at least 8 characters.");

    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    const response = await updateAccount({
      ...user,
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Settings Applied!");

      if (user.email !== account.email) {
        update({
          id: data?.user.id,
        });

        signOut();
      } else if (
        user.username !== account.username ||
        user.name !== account.name
      )
        update({
          id: data?.user.id,
        });

      setUser({ ...user, newPassword: undefined });
      togglePasswordFormModal();
    } else toast.error(response.data as string);

    setSubmitLoader(false);
  };

  return (
    <div className="mx-auto sm:w-[35rem] w-80">
      <div className="max-w-[25rem] w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-sm text-black dark:text-white">New Password</p>

        <input
          value={newPassword}
          onChange={(e) => setNewPassword1(e.target.value)}
          type="password"
          placeholder="••••••••••••••"
          className="w-full rounded-md p-3 mx-auto border-sky-100 dark:border-sky-800 dark:bg-sky-950 border-solid border outline-none focus:border-sky-700 duration-100"
        />
        <p className="text-sm text-black dark:text-white">
          Confirm New Password
        </p>

        <input
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          type="password"
          placeholder="••••••••••••••"
          className="w-full rounded-md p-3 mx-auto border-sky-100 dark:border-sky-800 dark:bg-sky-950 border-solid border outline-none focus:border-sky-700 duration-100"
        />

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label="Apply Settings"
          icon={faPenToSquare}
          className="mx-auto mt-2"
        />
      </div>
    </div>
  );
}
