import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Checkbox from "../../Checkbox";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { signOut, useSession } from "next-auth/react";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import SubmitButton from "../../SubmitButton";
import { toast } from "react-hot-toast";

type Props = {
  toggleSettingsModal: Function;
  setUser: Dispatch<SetStateAction<AccountSettings>>;
  user: AccountSettings;
};

export default function PrivacySettings({
  toggleSettingsModal,
  setUser,
  user,
}: Props) {
  const { update, data } = useSession();
  const { account, updateAccount } = useAccountStore();

  const [submitLoader, setSubmitLoader] = useState(false);

  const [whitelistedUsersTextbox, setWhiteListedUsersTextbox] = useState(
    user.whitelistedUsers.join(", ")
  );

  useEffect(() => {
    setUser({
      ...user,
      whitelistedUsers: stringToArray(whitelistedUsersTextbox),
    });
  }, [whitelistedUsersTextbox]);

  useEffect(() => {
    setUser({ ...user, newPassword: undefined });
  }, []);

  const stringToArray = (str: string) => {
    const stringWithoutSpaces = str.replace(/\s+/g, "");

    const wordsArray = stringWithoutSpaces.split(",");

    return wordsArray;
  };

  const submit = async () => {
    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    const response = await updateAccount({
      ...user,
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Settings Applied!");

      if (
        user.email !== account.email ||
        user.username !== account.username ||
        user.name !== account.name
      ) {
        update({
          id: data?.user.id,
        });

        signOut();
      }

      setUser({ ...user, newPassword: undefined });
      toggleSettingsModal();
    } else toast.error(response.data as string);
    setSubmitLoader(false);
  };

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      <div>
        <p className="text-sm text-sky-500 mb-2">Profile Visibility</p>

        <Checkbox
          label="Make profile private"
          state={user.isPrivate}
          className="text-sm sm:text-base"
          onClick={() => setUser({ ...user, isPrivate: !user.isPrivate })}
        />

        <p className="text-gray-500 text-sm">
          This will limit who can find and add you to other Collections.
        </p>

        {user.isPrivate && (
          <div>
            <p className="text-sm text-sky-500 my-2">Whitelisted Users</p>
            <p className="text-gray-500 text-sm mb-3">
              Please provide the Username of the users you wish to grant
              visibility to your profile. Separated by comma.
            </p>
            <textarea
              className="w-full resize-none border rounded-md duration-100 bg-white p-2 outline-none border-sky-100 focus:border-sky-500"
              placeholder="Your profile is hidden from everyone right now..."
              value={whitelistedUsersTextbox}
              onChange={(e) => {
                setWhiteListedUsersTextbox(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <SubmitButton
        onClick={submit}
        loading={submitLoader}
        label="Apply Settings"
        icon={faPenToSquare}
        className="mx-auto mt-2"
      />
    </div>
  );
}
