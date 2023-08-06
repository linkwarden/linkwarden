import SubmitButton from "@/components/SubmitButton";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  username: string;
  password: string;
}

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

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
    <CenteredForm text="Sign in to your account">
      <div className="p-2 flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 dark:bg-sky-950 rounded-2xl shadow-md border border-sky-100 dark:border-sky-800">
        <p className="text-2xl text-black dark:text-white text-center font-bold">
          Enter your credentials
        </p>

        <div>
          <p className="text-sm text-sky-700 dark:text-sky-300 w-fit font-semibold mb-1">
            Username
            {emailEnabled ? "/Email" : undefined}
          </p>

          <input
            type="text"
            placeholder="johnny"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-sky-800 dark:bg-sky-800 border-solid border outline-none focus:border-sky-700 duration-100"
          />
        </div>

        <div>
          <p className="text-sm text-sky-700 dark:text-sky-300 w-fit font-semibold mb-1">
            Password
          </p>

          <input
            type="password"
            placeholder="••••••••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-sky-800 dark:bg-sky-800 border-solid border outline-none focus:border-sky-700 duration-100"
          />
          {emailEnabled && (
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
          className=" w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500 dark:text-sky-300">New here?</p>
          <Link href={"/register"} className="block text-sky-700 dark:text-sky-500 font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    </CenteredForm>
  );
}
