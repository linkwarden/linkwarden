import SubmitButton from "@/components/SubmitButton";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
}

export default function Forgot() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    email: "",
  });

  async function loginUser() {
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
      <div className="p-2 flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 rounded-2xl shadow-md border border-sky-100">
        <p className="text-2xl text-black font-bold">Password Recovery</p>
        <div>
          <p className="text-md text-black">
            Enter your Email so we can send you a link to recover your account.
            Make sure to change your password in the profile settings
            afterwards.
          </p>
          <p className="text-sm text-gray-500">
            You wont get logged in if you haven't created an account yet.
          </p>
        </div>
        <div>
          <p className="text-sm text-sky-700 w-fit font-semibold mb-1">Email</p>

          <input
            type="text"
            placeholder="johnny@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
          />
        </div>

        <SubmitButton
          onClick={loginUser}
          label="Send Login Link"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <Link href={"/login"} className="block text-sky-700 font-bold">
            Go back
          </Link>
        </div>
      </div>
    </CenteredForm>
  );
}
