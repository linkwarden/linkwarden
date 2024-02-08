import SettingsLayout from "@/layouts/SettingsLayout";
import { useState, useEffect } from "react";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { toast } from "react-hot-toast";
import React from "react";
import useLocalSettingsStore from "@/store/localSettings";
import Checkbox from "@/components/Checkbox";
import SubmitButton from "@/components/SubmitButton";
import { LinksRouteTo } from "@prisma/client";

export default function Appearance() {
  const { updateSettings } = useLocalSettingsStore();

  const [submitLoader, setSubmitLoader] = useState(false);
  const { account, updateAccount } = useAccountStore();
  const [user, setUser] = useState<AccountSettings>(account);

  const [archiveAsScreenshot, setArchiveAsScreenshot] =
    useState<boolean>(false);
  const [archiveAsPDF, setArchiveAsPDF] = useState<boolean>(false);
  const [archiveAsWaybackMachine, setArchiveAsWaybackMachine] =
    useState<boolean>(false);
  const [linksRouteTo, setLinksRouteTo] = useState<LinksRouteTo>(user.linksRouteTo);

  useEffect(() => {
    setUser({
      ...account,
      archiveAsScreenshot,
      archiveAsPDF,
      archiveAsWaybackMachine,
      linksRouteTo
    });
  }, [account, archiveAsScreenshot, archiveAsPDF, archiveAsWaybackMachine, linksRouteTo]);

  function objectIsEmpty(obj: object) {
    return Object.keys(obj).length === 0;
  }

  useEffect(() => {
    if (!objectIsEmpty(account)) {
      setArchiveAsScreenshot(account.archiveAsScreenshot);
      setArchiveAsPDF(account.archiveAsPDF);
      setArchiveAsWaybackMachine(account.archiveAsWaybackMachine);
      setLinksRouteTo(account.linksRouteTo);
    }
  }, [account]);

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

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">Preference</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-3">Select Theme</p>
          <div className="flex gap-3 w-full">
            <div
              className={`w-full text-center outline-solid outline-neutral-content outline dark:outline-neutral-700 h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-black ${localStorage.getItem("theme") === "dark"
                ? "dark:outline-primary text-primary"
                : "text-white"
                }`}
              onClick={() => updateSettings({ theme: "dark" })}
            >
              <i className="bi-moon-fill text-6xl"></i>
              <p className="ml-2 text-2xl">Dark</p>

              {/* <hr className="my-3 outline-1 outline-neutral-content dark:outline-neutral-700" /> */}
            </div>
            <div
              className={`w-full text-center outline-solid outline-neutral-content outline dark:outline-neutral-700 h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-white ${localStorage.getItem("theme") === "light"
                ? "outline-primary text-primary"
                : "text-black"
                }`}
              onClick={() => updateSettings({ theme: "light" })}
            >
              <i className="bi-sun-fill text-6xl"></i>
              <p className="ml-2 text-2xl">Light</p>
              {/* <hr className="my-3 outline-1 outline-neutral-content dark:outline-neutral-700" /> */}
            </div>
          </div>
        </div>

        <div>
          <p className="capitalize text-3xl font-thin inline">
            Archive Settings
          </p>

          <div className="divider my-3"></div>

          <p>Formats to Archive/Preserve webpages:</p>
          <div className="p-3">
            <Checkbox
              label="Screenshot"
              state={archiveAsScreenshot}
              onClick={() => setArchiveAsScreenshot(!archiveAsScreenshot)}
            />

            <Checkbox
              label="PDF"
              state={archiveAsPDF}
              onClick={() => setArchiveAsPDF(!archiveAsPDF)}
            />

            <Checkbox
              label="Archive.org Snapshot"
              state={archiveAsWaybackMachine}
              onClick={() =>
                setArchiveAsWaybackMachine(!archiveAsWaybackMachine)
              }
            />
          </div>
        </div>

        <div>
          <p className="capitalize text-3xl font-thin inline">Link Settings</p>

          <div className="divider my-3"></div>

          <p>Clicking on Links should open:</p>
          <div className="p-3">
            <Checkbox
              label="Original"
              state={linksRouteTo === LinksRouteTo.ORIGINAL}
              onClick={() => setLinksRouteTo(LinksRouteTo.ORIGINAL)}
            />

            <Checkbox
              label="PDF"
              state={linksRouteTo === LinksRouteTo.PDF}
              onClick={() => setLinksRouteTo(LinksRouteTo.PDF)}
            />

            <Checkbox
              label="Readable"
              state={linksRouteTo === LinksRouteTo.READABLE}
              onClick={() => setLinksRouteTo(LinksRouteTo.READABLE)}
            />

            <Checkbox
              label="Screenshot"
              state={linksRouteTo === LinksRouteTo.SCREENSHOT}
              onClick={() => setLinksRouteTo(LinksRouteTo.SCREENSHOT)}
            />
          </div>
        </div>

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
