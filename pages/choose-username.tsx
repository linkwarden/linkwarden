import SubmitButton from "@/components/SubmitButton";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import useAccountStore from "@/store/account";
import CenteredForm from "@/layouts/CenteredForm";

export default function Subscribe() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const [inputedUsername, setInputedUsername] = useState("");

  const { data, status, update } = useSession();

  const { updateAccount, account } = useAccountStore();

  async function submitUsername() {
    setSubmitLoader(true);

    const redirectionToast = toast.loading("Applying...");

    const response = await updateAccount({
      ...account,
      username: inputedUsername,
    });

    if (response.ok) {
      toast.success("Username Applied!");

      update({
        id: data?.user.id,
      });
    } else toast.error(response.data as string);
    toast.dismiss(redirectionToast);
    setSubmitLoader(false);
  }

  return (
    <CenteredForm>
      <div className="p-4 mx-auto flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100">
        <p className="text-2xl text-center text-black dark:text-white font-bold">
          Choose a Username (Last step)
        </p>

        <div>
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Username
          </p>

          <input
            type="text"
            placeholder="john"
            value={inputedUsername}
            onChange={(e) => setInputedUsername(e.target.value)}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 dark:border-neutral-700 dark:bg-neutral-900 duration-100"
          />
        </div>
        <div>
          <p className="text-md text-gray-500 dark:text-gray-400 mt-1">
            Feel free to reach out to us at{" "}
            <a
              className="font-semibold underline"
              href="mailto:support@linkwarden.app"
            >
              support@linkwarden.app
            </a>{" "}
            in case of any issues.
          </p>
        </div>

        <SubmitButton
          onClick={submitUsername}
          label="Complete Registration"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />

        <div
          onClick={() => signOut()}
          className="w-fit mx-auto cursor-pointer text-gray-500 dark:text-gray-400 font-semibold "
        >
          Sign Out
        </div>
      </div>
    </CenteredForm>
  );
}
