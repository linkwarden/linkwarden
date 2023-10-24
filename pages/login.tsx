import SubmitButton from "@/components/SubmitButton";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState, FormEvent } from "react";
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

  async function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      <form onSubmit={loginUser}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
          <p className="text-3xl text-black dark:text-white text-center font-extralight">
            Enter your credentials
          </p>

          <hr className="border-1 border-sky-100 dark:border-neutral-700" />

          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Username
              {emailEnabled ? " or Email" : undefined}
            </p>

            <TextInput
              autoFocus={true}
              placeholder="johnny"
              value={form.username}
              className="bg-white"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="w-full">
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
            type="submit"
            label="Login"
            className=" w-full text-center"
            loading={submitLoader}
          />
          {process.env.NEXT_PUBLIC_DISABLE_REGISTRATION ===
          "true" ? undefined : (
            <div className="flex items-baseline gap-1 justify-center">
              <p className="w-fit text-gray-500 dark:text-gray-400">
                New here?
              </p>
              <Link
                href={"/register"}
                className="block text-black dark:text-white font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </form>
    </CenteredForm>
  );
}
