import AccentSubmitButton from "@/components/AccentSubmitButton";
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
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p className="text-3xl text-center font-extralight">
            Password Recovery
          </p>

          <div className="divider my-0"></div>

          <div>
            <p>
              Enter your email so we can send you a link to recover your
              account. Make sure to change your password in the profile settings
              afterwards.
            </p>
            <p className="text-sm text-neutral">
              You wont get logged in if you haven&apos;t created an account yet.
            </p>
          </div>
          <div>
            <p className="text-sm w-fit font-semibold mb-1">Email</p>

            <TextInput
              autoFocus
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <AccentSubmitButton
            type="submit"
            label="Send Login Link"
            className="mt-2 w-full"
            loading={submitLoader}
          />
          <div className="flex items-baseline gap-1 justify-center">
            <Link href={"/login"} className="block font-bold">
              Go back
            </Link>
          </div>
        </div>
      </form>
    </CenteredForm>
  );
}
