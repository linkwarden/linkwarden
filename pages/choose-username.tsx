import SubmitButton from "@/components/SubmitButton";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import useAccountStore from "@/store/account";

export default function Subscribe() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const [inputedUsername, setInputedUsername] = useState("");

  const { data, status, update } = useSession();

  const { updateAccount, account } = useAccountStore();

  useEffect(() => {
    console.log(data?.user);
  }, [status]);

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

      signOut();
    } else toast.error(response.data as string);
    toast.dismiss(redirectionToast);
    setSubmitLoader(false);
  }

  return (
    <>
      <div className="p-2 mt-10 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="flex flex-col gap-2 justify-between items-center mb-5">
          <Image
            src="/linkwarden.png"
            width={1694}
            height={483}
            alt="Linkwarden"
            className="h-12 w-fit mx-auto"
          />

          <div className="text-center">
            <p className="text-3xl text-sky-500">One Last Step...</p>
            <p className="font-semibold text-sky-400">
              Please choose a username to start using your account.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
            Username
          </p>

          <input
            type="text"
            placeholder="john"
            value={inputedUsername}
            onChange={(e) => setInputedUsername(e.target.value)}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <p className="text-gray-500 text-center">
          Note that you will have to log back in to complete the process.
        </p>
        <div>
          <p className="text-md text-gray-500 mt-1">
            Feel free to reach out to us at{" "}
            <a className="font-semibold" href="mailto:hello@linkwarden.app">
              hello@linkwarden.app
            </a>{" "}
            in case of any issues.
          </p>
        </div>

        <SubmitButton
          onClick={submitUsername}
          label="Choose Username"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />

        <div
          onClick={() => signOut()}
          className="w-fit mx-auto cursor-pointer text-gray-500 font-semibold "
        >
          Sign Out
        </div>
      </div>
    </>
  );
}
