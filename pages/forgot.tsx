import SubmitButton from "@/components/SubmitButton";
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
    <>
      <div className="p-5 mt-10 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="flex flex-col gap-2 sm:flex-row justify-between items-center mb-5">
          <Image
            src="/linkwarden.png"
            width={1694}
            height={483}
            alt="Linkwarden"
            className="h-12 w-fit"
          />
          <div className="text-center sm:text-right">
            <p className="text-3xl font-bold text-sky-500">Password Reset</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">Email</p>

          <input
            type="text"
            placeholder="johnny@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
          <p className="text-md text-gray-500 mt-1">
            Make sure to change your password in the profile settings
            afterwards.
          </p>
        </div>

        <SubmitButton
          onClick={loginUser}
          label="Send Login Link"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <Link href={"/login"} className="block text-sky-500 font-bold">
            Go back
          </Link>
        </div>
      </div>
    </>
  );
}
