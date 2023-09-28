import SubmitButton from "@/components/SubmitButton";
import TextInput from "@/components/TextInput";
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
      <div className="p-4 flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
        <p className="text-2xl text-black dark:text-white text-center font-bold">
          Enter your credentials
        </p>

        <div>
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Username
            {emailEnabled ? " or Email" : undefined}
          </p>

          <TextInput
            placeholder="johnny"
            value={form.username}
            className="bg-white"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Password
          </p>

          <TextInput
            type="password"
            placeholder="••••••••••••••"
            value={form.password}
            className="bg-white"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {emailEnabled && (
            <div className="w-fit ml-auto mt-1">
              <Link
                href={"/forgot"}
                className="text-gray-500 dark:text-gray-400 font-semibold"
              >
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
        {process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true" ? undefined : (
          <div className="flex items-baseline gap-1 justify-center">
            <p className="w-fit text-gray-500 dark:text-gray-400">New here?</p>
            <Link
              href={"/register"}
              className="block text-black dark:text-white font-semibold"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </CenteredForm>
  );
}
