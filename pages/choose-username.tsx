import SubmitButton from "@/components/SubmitButton";
import { signOut } from "next-auth/react";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import useAccountStore from "@/store/account";
import CenteredForm from "@/layouts/CenteredForm";
import TextInput from "@/components/TextInput";

export default function ChooseUsername() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const [inputedUsername, setInputedUsername] = useState("");

  const { data, status, update } = useSession();

  const { updateAccount, account } = useAccountStore();

  async function submitUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      <form onSubmit={submitUsername}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100">
          <p className="text-3xl text-center text-black dark:text-white font-extralight">
            Choose a Username
          </p>

          <hr className="border-1 border-sky-100 dark:border-neutral-700" />

          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Username
            </p>

            <TextInput
              autoFocus
              placeholder="john"
              value={inputedUsername}
              className="bg-white"
              onChange={(e) => setInputedUsername(e.target.value)}
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
            type="submit"
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
      </form>
    </CenteredForm>
  );
}
