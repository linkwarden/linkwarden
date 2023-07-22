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
      <Image
        src="/linkwarden.png"
        width={518}
        height={145}
        alt="Linkwarden"
        className="h-12 w-fit mx-auto mt-10"
      />
      <div className="p-2 mt-10 mx-auto flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <p className="text-xl text-sky-500 w-fit font-bold">Fogot Password?</p>
        <p className="text-md text-gray-500 mt-1">
          Enter your Email so we can send you a link to recover your account.
        </p>
        <p className="text-md text-gray-500 mt-1">
          Make sure to change your password in the profile settings afterwards.
        </p>
        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">Email</p>

          <input
            type="text"
            placeholder="johnny@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
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
      <p className="text-center text-xs text-gray-500 my-10">
        © {new Date().getFullYear()} Linkwarden. All rights reserved.{" "}
      </p>
    </>
  );
}
