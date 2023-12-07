import Checkbox from "@/components/Checkbox";
import SubmitButton from "@/components/SubmitButton";
import SettingsLayout from "@/layouts/SettingsLayout";
import React, { useEffect, useState } from "react";
import useAccountStore from "@/store/account";
import { toast } from "react-hot-toast";
import { AccountSettings } from "@/types/global";
import TextInput from "@/components/TextInput";

export default function Api() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const { account, updateAccount } = useAccountStore();
  const [user, setUser] = useState<AccountSettings>(account);

  const [archiveAsScreenshot, setArchiveAsScreenshot] =
    useState<boolean>(false);
  const [archiveAsPDF, setArchiveAsPDF] = useState<boolean>(false);
  const [archiveAsWaybackMachine, setArchiveAsWaybackMachine] =
    useState<boolean>(false);

  useEffect(() => {
    setUser({
      ...account,
      archiveAsScreenshot,
      archiveAsPDF,
      archiveAsWaybackMachine,
    });
  }, [account, archiveAsScreenshot, archiveAsPDF, archiveAsWaybackMachine]);

  function objectIsEmpty(obj: object) {
    return Object.keys(obj).length === 0;
  }

  useEffect(() => {
    if (!objectIsEmpty(account)) {
      setArchiveAsScreenshot(account.archiveAsScreenshot);
      setArchiveAsPDF(account.archiveAsPDF);
      setArchiveAsWaybackMachine(account.archiveAsWaybackMachine);
    }
  }, [account]);

  const submit = async () => {
    // setSubmitLoader(true);
    // const load = toast.loading("Applying...");
    // const response = await updateAccount({
    //   ...user,
    // });
    // toast.dismiss(load);
    // if (response.ok) {
    //   toast.success("Settings Applied!");
    // } else toast.error(response.data as string);
    // setSubmitLoader(false);
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">API Keys (Soon)</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-3">
        <div className="badge badge-warning rounded-md w-fit">
          Status: Under Development
        </div>

        <p>This page will be for creating and managing your API keys.</p>

        <p>
          For now, you can <i>temporarily</i> use your{" "}
          <code className="text-xs whitespace-nowrap bg-black/40 rounded-md px-2 py-1">
            next-auth.session-token
          </code>{" "}
          in your browser cookies as the API key for your integrations.
        </p>
      </div>
    </SettingsLayout>
  );
}
