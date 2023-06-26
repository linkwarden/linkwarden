import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AccountSettings } from "@/types/global";
import useAccountStore from "@/store/account";
import { useSession } from "next-auth/react";
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
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [submitLoader, setSubmitLoader] = useState(false);

  const { account, updateAccount } = useAccountStore();
  const { update } = useSession();

  useEffect(() => {
    if (
      !(oldPassword == "" || newPassword == "" || newPassword2 == "") &&
      newPassword === newPassword2
    ) {
      setUser({ ...user, oldPassword, newPassword });
    }
  }, [oldPassword, newPassword, newPassword2]);

  const submit = async () => {
    if (oldPassword == "" || newPassword == "" || newPassword2 == "") {
      toast.error("Please fill all the fields.");
    } else if (newPassword === newPassword2) {
      setSubmitLoader(true);

      const load = toast.loading("Applying...");

      const response = await updateAccount({
        ...user,
      });

      toast.dismiss(load);

      if (response.ok) {
        toast.success("Settings Applied!");
        togglePasswordFormModal();
      } else toast.error(response.data as string);

      setSubmitLoader(false);

      if (user.email !== account.email || user.name !== account.name)
        update({ email: user.email, name: user.name });

      if (response.ok) {
        setUser({ ...user, oldPassword: undefined, newPassword: undefined });
        togglePasswordFormModal();
      }
    } else {
      toast.error("Passwords do not match.");
    }
  };

  return (
    <div className="mx-auto sm:w-[35rem] w-80">
      <div className="max-w-[25rem] w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-sm text-sky-500">Old Password</p>

        <input
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          type="password"
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
        <p className="text-sm text-sky-500">New Password</p>

        <input
          value={newPassword}
          onChange={(e) => setNewPassword1(e.target.value)}
          type="password"
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
        <p className="text-sm text-sky-500">Re-enter New Password</p>

        <input
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          type="password"
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
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
