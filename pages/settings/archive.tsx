import Checkbox from "@/components/Checkbox";
import SubmitButton from "@/components/SubmitButton";
import SettingsLayout from "@/layouts/SettingsLayout";
import React, { useEffect, useState } from "react";
import useAccountStore from "@/store/account";
import { toast } from "react-hot-toast";
import { AccountSettings } from "@/types/global";

export default function Archive() {
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
      <p>Formats to Archive webpages:</p>
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
          onClick={() => setArchiveAsWaybackMachine(!archiveAsWaybackMachine)}
        />
      </div>

      <SubmitButton
        onClick={submit}
        loading={submitLoader}
        label="Save"
        className="mt-2 mx-auto lg:mx-0"
      />
    </SettingsLayout>
  );
}
