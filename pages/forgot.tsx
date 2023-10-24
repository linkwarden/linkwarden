import SubmitButton from "@/components/SubmitButton";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
}

export default function Forgot() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    email: "",
  });

  async function sendConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.email !== "") {
      setSubmitLoader(true);

      const load = toast.loading("Sending login link...");

      await signIn("email", {
        email: form.email,
        callbackUrl: "/",
      });

      toast.dismiss(load);

      setSubmitLoader(false);

      toast.success("Login link sent.");
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <CenteredForm>
      <form onSubmit={sendConfirmation}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100">
          <p className="text-3xl text-center text-black dark:text-white font-extralight">
            Password Recovery
          </p>

          <hr className="border-1 border-sky-100 dark:border-neutral-700" />

          <div>
            <p className="text-black dark:text-white">
              Enter your email so we can send you a link to recover your
              account. Make sure to change your password in the profile settings
              afterwards.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You wont get logged in if you haven&apos;t created an account yet.
            </p>
          </div>
          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Email
            </p>

            <TextInput
              autoFocus
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              className="bg-white"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <SubmitButton
            type="submit"
            label="Send Login Link"
            className="mt-2 w-full text-center"
            loading={submitLoader}
          />
          <div className="flex items-baseline gap-1 justify-center">
            <Link
              href={"/login"}
              className="block text-black dark:text-white font-bold"
            >
              Go back
            </Link>
          </div>
        </div>
      </form>
    </CenteredForm>
  );
}
