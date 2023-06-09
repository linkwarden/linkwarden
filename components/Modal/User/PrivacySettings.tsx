import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Checkbox from "../../Checkbox";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { useSession } from "next-auth/react";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import SubmitButton from "../../SubmitButton";

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
  const { update } = useSession();
  const { account, updateAccount } = useAccountStore();

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
    setUser({ ...user, oldPassword: undefined, newPassword: undefined });
  }, []);

  const stringToArray = (str: string) => {
    const stringWithoutSpaces = str.replace(/\s+/g, "");

    const wordsArray = stringWithoutSpaces.split(",");

    return wordsArray;
  };

  const submit = async () => {
    const response = await updateAccount({
      ...user,
    });

    setUser({ ...user, oldPassword: undefined, newPassword: undefined });

    if (user.email !== account.email || user.name !== account.name)
      update({ email: user.email, name: user.name });

    if (response) toggleSettingsModal();
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
              Please provide the Email addresses of the users you wish to grant
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
        label="Apply Settings"
        icon={faPenToSquare}
        className="mx-auto mt-2"
      />
    </div>
  );
}
