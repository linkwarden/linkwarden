import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  username: string;
  password: string;
}

const EmailProvider = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

export default function Login() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    username: "",
    password: "",
  });

  async function loginUser() {
    if (form.username !== "" && form.password !== "") {
      setSubmitLoader(true);

      const load = toast.loading("Authenticating...");

      const res = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      toast.dismiss(load);

      setSubmitLoader(false);

      if (!res?.ok) {
        toast.error("Invalid login.");
      }
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <>
      <p className="text-xl font-bold text-center text-sky-500 mt-10 mb-3">
        Linkwarden
      </p>
      <div className="p-5 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="my-5 text-center">
          <p className="text-3xl font-bold text-sky-500">Welcome back</p>
          <p className="text-md font-semibold text-sky-400">
            Sign in to your account
          </p>
        </div>

        <p className="text-sm text-sky-500 w-fit font-semibold">
          Username
          {EmailProvider ? " or Email" : undefined}
        </p>

        <input
          type="text"
          placeholder="johnny"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">Password</p>

        <input
          type="password"
          placeholder="*****************"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
        <SubmitButton
          onClick={loginUser}
          label="Login"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
      </div>
      <div className="flex items-baseline gap-1 justify-center my-3">
        <p className="w-fit text-gray-500">New here?</p>
        <Link href={"/register"} className="block text-sky-500 font-bold">
          Sign Up
        </Link>
      </div>
      {EmailProvider && (
        <div className="flex items-baseline gap-1 justify-center mb-3">
          <p className="w-fit text-gray-500">Forgot your password?</p>
          <Link href={"/forgot"} className="block text-sky-500 font-bold">
            Send login link
          </Link>
        </div>
      )}
    </>
  );
}
