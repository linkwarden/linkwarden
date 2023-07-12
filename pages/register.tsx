import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";

const EmailProvider = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

type FormData = {
  name: string;
  username: string;
  email?: string;
  password: string;
  passwordConfirmation: string;
};

export default function Register() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    email: EmailProvider ? "" : undefined,
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser() {
    const checkHasEmptyFields = () => {
      if (EmailProvider) {
        return (
          form.name !== "" &&
          form.username !== "" &&
          form.email !== "" &&
          form.password !== "" &&
          form.passwordConfirmation !== ""
        );
      } else {
        return (
          form.name !== "" &&
          form.username !== "" &&
          form.password !== "" &&
          form.passwordConfirmation !== ""
        );
      }
    };

    const sendConfirmation = async () => {
      await signIn("email", {
        email: form.email,
        callbackUrl: "/",
      });
    };

    if (checkHasEmptyFields()) {
      if (form.password === form.passwordConfirmation) {
        const { passwordConfirmation, ...request } = form;

        setSubmitLoader(true);

        const load = toast.loading("Creating Account...");

        const response = await fetch("/api/auth/register", {
          body: JSON.stringify(request),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        const data = await response.json();

        toast.dismiss(load);
        setSubmitLoader(false);

        if (response.ok) {
          if (form.email) await sendConfirmation();

          toast.success(
            EmailProvider
              ? "User Created! Please check you email."
              : "User Created!"
          );
        } else {
          toast.error(data.response);
        }
      } else {
        toast.error("Passwords do not match.");
      }
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <>
      <p className="text-xl font-bold text-center my-10 mb-3 text-sky-500">
        Linkwarden
      </p>
      <div className="p-5 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="my-5 text-center">
          <p className="text-3xl font-bold text-sky-500">Get started</p>
          <p className="text-md font-semibold text-sky-400">
            Create a new account
          </p>
        </div>

        <p className="text-sm text-sky-500 w-fit font-semibold">Display Name</p>

        <input
          type="text"
          placeholder="Johnny"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">Username</p>

        <input
          type="text"
          placeholder="john"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        {EmailProvider ? (
          <>
            <p className="text-sm text-sky-500 w-fit font-semibold">Email</p>

            <input
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </>
        ) : undefined}

        <p className="text-sm text-sky-500 w-fit font-semibold">Password</p>

        <input
          type="password"
          placeholder="*****************"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">
          Re-enter Password
        </p>

        <input
          type="password"
          placeholder="*****************"
          value={form.passwordConfirmation}
          onChange={(e) =>
            setForm({ ...form, passwordConfirmation: e.target.value })
          }
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
        <SubmitButton
          onClick={registerUser}
          label="Sign Up"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
      </div>
      <div className="flex items-baseline gap-1 justify-center my-3">
        <p className="w-fit text-gray-500">Already have an account?</p>
        <Link href={"/login"} className="block w-min text-sky-500 font-bold">
          Login
        </Link>
      </div>
    </>
  );
}
