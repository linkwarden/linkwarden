import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Checkbox from "../../Checkbox";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { signOut, useSession } from "next-auth/react";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import SubmitButton from "../../SubmitButton";
import { toast } from "react-hot-toast";
import Link from "next/link";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import useInitialData from "@/hooks/useInitialData";

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

  const [importDropdown, setImportDropdown] = useState(false);
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

  const postBookmarkFile = async (e: any) => {
    const file: File = e.target.files[0];

    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = async function (e) {
        const load = toast.loading("Importing...");

        const response = await fetch("/api/migration", {
          method: "POST",
          body: e.target?.result,
        });

        const data = await response.json();

        toast.dismiss(load);

        toast.success("Imported the Bookmarks! Reloading the page...");

        setImportDropdown(false);

        setTimeout(() => {
          location.reload();
        }, 2000);
      };
      reader.onerror = function (e) {
        console.log("Error:", e);
      };
    }
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
      toggleSettingsModal();
    } else toast.error(response.data as string);
    setSubmitLoader(false);
  };

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      <div>
        <p className="text-sm text-black dark:text-white mb-2">
          Profile Visibility
        </p>

        <Checkbox
          label="Make profile private"
          state={user.isPrivate}
          className="text-sm sm:text-base"
          onClick={() => setUser({ ...user, isPrivate: !user.isPrivate })}
        />

        <p className="text-gray-500 dark:text-gray-300 text-sm">
          This will limit who can find and add you to other Collections.
        </p>

        {user.isPrivate && (
          <div>
            <p className="text-sm text-black dark:text-white mt-2">
              Whitelisted Users
            </p>
            <p className="text-gray-500 dark:text-gray-300 text-sm mb-3">
              Please provide the Username of the users you wish to grant
              visibility to your profile. Separated by comma.
            </p>
            <textarea
              className="w-full resize-none border rounded-md duration-100 bg-gray-50 dark:bg-neutral-950 p-2 outline-none border-sky-100 dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600"
              placeholder="Your profile is hidden from everyone right now..."
              value={whitelistedUsersTextbox}
              onChange={(e) => {
                setWhiteListedUsersTextbox(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm text-black dark:text-white mb-2">Import Data</p>

        <div className="flex gap-2">
          <div
            onClick={() => setImportDropdown(true)}
            className="w-fit relative"
            id="import-dropdown"
          >
            <div
              id="import-dropdown"
              className="border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 px-2 text-center select-none cursor-pointer duration-100 hover:border-sky-300 hover:dark:border-sky-600"
            >
              Import From
            </div>
            {importDropdown ? (
              <ClickAwayHandler
                onClickOutside={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target.id !== "import-dropdown") setImportDropdown(false);
                }}
                className={`absolute top-7 left-0 w-48 py-1 shadow-md border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-md flex flex-col z-20`}
              >
                <div className="cursor-pointer rounded-md">
                  <label
                    htmlFor="import-file"
                    title="HTML File"
                    className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 hover:dark:bg-neutral-700  duration-100 cursor-pointer"
                  >
                    Bookmarks HTML file...
                    <input
                      type="file"
                      name="photo"
                      id="import-file"
                      accept=".html"
                      className="hidden"
                      onChange={postBookmarkFile}
                    />
                  </label>
                </div>
              </ClickAwayHandler>
            ) : null}
          </div>

          {/* Commented out for now. */}
          {/* <Link className="w-fit" href="/api/migration">
            <div className="border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 px-2 text-center select-none cursor-pointer duration-100 hover:border-sky-300 hover:dark:border-sky-600">
              Export Data
            </div>
          </Link> */}
        </div>
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
