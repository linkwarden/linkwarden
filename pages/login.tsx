import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import Image from "next/image";
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
      <div className="p-5 my-10 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="text-right flex flex-col gap-2 sm:flex-row justify-between items-center mb-5">
          <Image
            src="/linkwarden.png"
            width={1694}
            height={483}
            alt="Linkwarden"
            className="h-12 w-fit"
          />
          <div className="text-center sm:text-right">
            <p className="text-3xl font-bold text-sky-500">Welcome back</p>
            <p className="text-md font-semibold text-sky-400">
              Sign in to your account
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
            Username
            {EmailProvider ? "/Email" : undefined}
          </p>

          <input
            type="text"
            placeholder="johnny"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
            Password
          </p>

          <input
            type="password"
            placeholder="***********"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
          {EmailProvider && (
            <div className="w-fit ml-auto mt-1">
              <Link href={"/forgot"} className="text-gray-500 font-semibold">
                Forgot Password?
              </Link>
            </div>
          )}
        </div>

        <SubmitButton
          onClick={loginUser}
          label="Login"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500">New here?</p>
          <Link href={"/register"} className="block text-sky-500 font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
