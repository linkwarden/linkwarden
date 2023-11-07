import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { toast } from "react-hot-toast";
import SettingsLayout from "@/layouts/SettingsLayout";
import TextInput from "@/components/TextInput";
import { resizeImage } from "@/lib/client/resizeImage";
import ProfilePhoto from "@/components/ProfilePhoto";
import SubmitButton from "@/components/SubmitButton";
import { useSession, signOut } from "next-auth/react";
import React from "react";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import Link from "next/link";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Checkbox from "@/components/Checkbox";

export default function Account() {
  const { update, data } = useSession();

  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

  const [submitLoader, setSubmitLoader] = useState(false);

  const { account, updateAccount } = useAccountStore();

  const [user, setUser] = useState<AccountSettings>(
    !objectIsEmpty(account)
      ? account
      : ({
          // @ts-ignore
          id: null,
          name: "",
          username: "",
          email: "",
          emailVerified: null,
          image: "",
          isPrivate: true,
          // @ts-ignore
          createdAt: null,
          whitelistedUsers: [],
        } as unknown as AccountSettings)
  );

  function objectIsEmpty(obj: object) {
    return Object.keys(obj).length === 0;
  }

  useEffect(() => {
    if (!objectIsEmpty(account)) setUser({ ...account });
  }, [account]);

  const handleImageUpload = async (e: any) => {
    const file: File = e.target.files[0];
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
        toast.error("Please select a PNG or JPEG file thats less than 1MB.");
      }
    } else {
      toast.error("Invalid file format.");
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
    } else toast.error(response.data as string);
    setSubmitLoader(false);
  };

  const [importDropdown, setImportDropdown] = useState(false);

  const importBookmarks = async (e: any, format: MigrationFormat) => {
    const file: File = e.target.files[0];

    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = async function (e) {
        const load = toast.loading("Importing...");

        const request: string = e.target?.result as string;

        const body: MigrationRequest = {
          format,
          data: request,
        };

        const response = await fetch("/api/v1/migration", {
          method: "POST",
          body: JSON.stringify(body),
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

  const [whitelistedUsersTextbox, setWhiteListedUsersTextbox] = useState("");

  useEffect(() => {
    setWhiteListedUsersTextbox(account?.whitelistedUsers?.join(", "));
  }, [account]);

  useEffect(() => {
    setUser({
      ...user,
      whitelistedUsers: stringToArray(whitelistedUsersTextbox),
    });
  }, [whitelistedUsersTextbox]);

  const stringToArray = (str: string) => {
    const stringWithoutSpaces = str?.replace(/\s+/g, "");

    const wordsArray = stringWithoutSpaces?.split(",");

    return wordsArray;
  };

  return (
    <SettingsLayout>
      <div className="flex flex-col gap-10 justify-between sm:w-[35rem] w-80 mx-auto lg:mx-0">
        <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-black dark:text-white mb-2">Display Name</p>
              <TextInput
                value={user.name || ""}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div>
              <p className="text-black dark:text-white mb-2">Username</p>
              <TextInput
                value={user.username || ""}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </div>

            {emailEnabled ? (
              <div>
                <p className="text-black dark:text-white mb-2">Email</p>
                {user.email !== account.email &&
                process.env.NEXT_PUBLIC_STRIPE === "true" ? (
                  <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
                    Updating this field will change your billing email as well
                  </p>
                ) : undefined}
                <TextInput
                  value={user.email || ""}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
            ) : undefined}
          </div>

          <div className="sm:row-span-2 sm:justify-self-center mx-auto my-3">
            <p className="text-black dark:text-white mb-2 text-center">
              Profile Photo
            </p>
            <div className="w-28 h-28 flex items-center justify-center rounded-full relative">
              <ProfilePhoto
                priority={true}
                src={user.image ? user.image : undefined}
                className="h-auto border-none w-28"
              />
              {user.image && (
                <div
                  onClick={() =>
                    setUser({
                      ...user,
                      image: "",
                    })
                  }
                  className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center border p-1 border-slate-200 dark:border-neutral-700 rounded-full bg-white dark:bg-neutral-800 text-center select-none cursor-pointer duration-100 hover:text-red-500"
                >
                  <FontAwesomeIcon icon={faClose} className="w-3 h-3" />
                </div>
              )}
              <div className="absolute -bottom-3 left-0 right-0 mx-auto w-fit text-center">
                <label className="border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 px-2 text-center select-none cursor-pointer duration-100 hover:border-sky-300 hover:dark:border-sky-600">
                  Browse...
                  <input
                    type="file"
                    name="photo"
                    id="upload-photo"
                    accept=".png, .jpeg, .jpg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="text-black dark:text-white truncate w-full pr-7 text-3xl font-thin">
              Import & Export
            </p>
          </div>

          <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" />

          <div className="flex gap-3 flex-col">
            <div>
              <p className="text-black dark:text-white mb-2">
                Import your data from other platforms.
              </p>
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
                      if (target.id !== "import-dropdown")
                        setImportDropdown(false);
                    }}
                    className={`absolute top-7 left-0 w-52 py-1 shadow-md border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-md flex flex-col z-20`}
                  >
                    <div className="cursor-pointer rounded-md">
                      <label
                        htmlFor="import-linkwarden-file"
                        title="JSON File"
                        className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 hover:dark:bg-neutral-700  duration-100 cursor-pointer"
                      >
                        Linkwarden File...
                        <input
                          type="file"
                          name="photo"
                          id="import-linkwarden-file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) =>
                            importBookmarks(e, MigrationFormat.linkwarden)
                          }
                        />
                      </label>
                      <label
                        htmlFor="import-html-file"
                        title="HTML File"
                        className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 hover:dark:bg-neutral-700  duration-100 cursor-pointer"
                      >
                        Bookmarks HTML file...
                        <input
                          type="file"
                          name="photo"
                          id="import-html-file"
                          accept=".html"
                          className="hidden"
                          onChange={(e) =>
                            importBookmarks(e, MigrationFormat.htmlFile)
                          }
                        />
                      </label>
                    </div>
                  </ClickAwayHandler>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-black dark:text-white mb-2">
                Download your data instantly.
              </p>
              <Link className="w-fit" href="/api/v1/migration">
                <div className="border w-fit border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 px-2 text-center select-none cursor-pointer duration-100 hover:border-sky-300 hover:dark:border-sky-600">
                  Export Data
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="text-black dark:text-white truncate w-full pr-7 text-3xl font-thin">
              Profile Visibility
            </p>
          </div>

          <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" />

          <Checkbox
            label="Make profile private"
            state={user.isPrivate}
            onClick={() => setUser({ ...user, isPrivate: !user.isPrivate })}
          />

          <p className="text-gray-500 dark:text-gray-300 text-sm">
            This will limit who can find and add you to other Collections.
          </p>

          {user.isPrivate && (
            <div>
              <p className="text-black dark:text-white mt-2">
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
                onChange={(e) => setWhiteListedUsersTextbox(e.target.value)}
              />
            </div>
          )}
        </div>

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label="Save"
          className="mt-2 mx-auto lg:mx-0"
        />

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="text-red-500 dark:text-red-500 truncate w-full pr-7 text-3xl font-thin">
              Delete Account
            </p>
          </div>

          <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" />

          <p>
            This will permanently delete ALL the Links, Collections, Tags, and
            archived data you own.{" "}
            {process.env.NEXT_PUBLIC_STRIPE
              ? "It will also cancel your subscription. "
              : undefined}{" "}
            You will be prompted to enter your password before the deletion
            process.
          </p>

          <Link
            href="/settings/delete"
            className="mx-auto lg:mx-0 text-white mt-3 flex items-center gap-2 py-1 px-3 rounded-md text-lg tracking-wide select-none font-semibold duration-100 w-fit bg-red-500 hover:bg-red-400 cursor-pointer"
          >
            <p className="text-center w-full">Delete Your Account</p>
          </Link>
        </div>
      </div>
    </SettingsLayout>
  );
}
