import { useState, useEffect } from "react";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { toast } from "react-hot-toast";
import SettingsLayout from "@/layouts/SettingsLayout";
import TextInput from "@/components/TextInput";
import { resizeImage } from "@/lib/client/resizeImage";
import ProfilePhoto from "@/components/ProfilePhoto";
import SubmitButton from "@/components/SubmitButton";
import React from "react";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import { dropdownTriggerer } from "@/lib/client/utils";

export default function Account() {
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

  const importBookmarks = async (e: any, format: MigrationFormat) => {
    setSubmitLoader(true);

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

        if (response.ok) {
          toast.success("Imported the Bookmarks! Reloading the page...");
          setTimeout(() => {
            location.reload();
          }, 2000);
        } else toast.error(data.response as string);
      };
      reader.onerror = function (e) {
        console.log("Error:", e);
      };
    }

    setSubmitLoader(false);
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
      <p className="capitalize text-3xl font-thin inline">Account Settings</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2">Display Name</p>
              <TextInput
                value={user.name || ""}
                className="bg-base-200"
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div>
              <p className="mb-2">Username</p>
              <TextInput
                value={user.username || ""}
                className="bg-base-200"
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </div>

            {emailEnabled ? (
              <div>
                <p className="mb-2">Email</p>
                {user.email !== account.email &&
                process.env.NEXT_PUBLIC_STRIPE === "true" ? (
                  <p className="text-neutral mb-2 text-sm">
                    Updating this field will change your billing email as well
                  </p>
                ) : undefined}
                <TextInput
                  value={user.email || ""}
                  className="bg-base-200"
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
            ) : undefined}
          </div>

          <div className="sm:row-span-2 sm:justify-self-center my-3">
            <p className="mb-2 sm:text-center">Profile Photo</p>
            <div className="w-28 h-28 flex items-center justify-center rounded-full relative">
              <ProfilePhoto
                priority={true}
                src={user.image ? user.image : undefined}
                large={true}
              />
              {user.image && (
                <div
                  onClick={() =>
                    setUser({
                      ...user,
                      image: "",
                    })
                  }
                  className="absolute top-1 left-1 btn btn-xs btn-circle btn-neutral btn-outline bg-base-100"
                >
                  <i className="bi-x"></i>
                </div>
              )}
              <div className="absolute -bottom-3 left-0 right-0 mx-auto w-fit text-center">
                <label className="btn btn-xs btn-neutral btn-outline bg-base-100">
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
            <p className="truncate w-full pr-7 text-3xl font-thin">
              Import & Export
            </p>
          </div>

          <div className="divider my-3"></div>

          <div className="flex gap-3 flex-col">
            <div>
              <p className="mb-2">Import your data from other platforms.</p>
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  onMouseDown={dropdownTriggerer}
                  className="flex gap-2 text-sm btn btn-outline btn-neutral group"
                  id="import-dropdown"
                >
                  <i className="bi-cloud-upload text-xl duration-100"></i>
                  <p>Import From</p>
                </div>
                <ul className="shadow menu dropdown-content z-[1] bg-base-200 border border-neutral-content rounded-box mt-1 w-60">
                  <li>
                    <label
                      tabIndex={0}
                      role="button"
                      htmlFor="import-linkwarden-file"
                      title="JSON File"
                    >
                      From Linkwarden
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
                  </li>
                  <li>
                    <label
                      tabIndex={0}
                      role="button"
                      htmlFor="import-html-file"
                      title="HTML File"
                    >
                      From Bookmarks HTML file
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
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <p className="mb-2">Download your data instantly.</p>
              <Link className="w-fit" href="/api/v1/migration">
                <div className="flex w-fit gap-2 text-sm btn btn-outline btn-neutral group">
                  <i className="bi-cloud-download text-xl duration-100"></i>
                  <p>Export Data</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="truncate w-full pr-7 text-3xl font-thin">
              Profile Visibility
            </p>
          </div>

          <div className="divider my-3"></div>

          <Checkbox
            label="Make profile private"
            state={user.isPrivate}
            onClick={() => setUser({ ...user, isPrivate: !user.isPrivate })}
          />

          <p className="text-neutral text-sm">
            This will limit who can find and add you to new Collections.
          </p>

          {user.isPrivate && (
            <div className="pl-5">
              <p className="mt-2">Whitelisted Users</p>
              <p className="text-neutral text-sm mb-3">
                Please provide the Username of the users you wish to grant
                visibility to your profile. Separated by comma.
              </p>
              <textarea
                className="w-full resize-none border rounded-md duration-100 bg-base-200 p-2 outline-none border-neutral-content focus:border-primary"
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
          label="Save Changes"
          className="mt-2 w-full sm:w-fit"
        />

        <div>
          <div className="flex items-center gap-2 w-full rounded-md h-8">
            <p className="text-red-500 dark:text-red-500 truncate w-full pr-7 text-3xl font-thin">
              Delete Account
            </p>
          </div>

          <div className="divider my-3"></div>

          <p>
            This will permanently delete ALL the Links, Collections, Tags, and
            archived data you own.{" "}
            {process.env.NEXT_PUBLIC_STRIPE
              ? "It will also cancel your subscription. "
              : undefined}{" "}
            You will be prompted to enter your password before the deletion
            process.
          </p>
        </div>

        <Link
          href="/settings/delete"
          className="text-white w-full sm:w-fit flex items-center gap-2 py-2 px-4 rounded-md text-lg tracking-wide select-none font-semibold duration-100 bg-red-500 hover:bg-red-400 cursor-pointer"
        >
          <p className="text-center w-full">Delete Your Account</p>
        </Link>
      </div>
    </SettingsLayout>
  );
}
