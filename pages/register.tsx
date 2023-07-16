import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import Image from "next/image";

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

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
    email: emailEnabled ? "" : undefined,
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser() {
    const checkHasEmptyFields = () => {
      if (emailEnabled) {
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

          toast.success("User Created!");
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
      <div className="p-2 mx-auto my-10 flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="flex flex-col gap-2 sm:flex-row justify-between items-center mb-5">
          <Image
            src="/linkwarden.png"
            width={1694}
            height={483}
            alt="Linkwarden"
            className="h-12 w-fit"
          />
          <div className="text-center sm:text-right">
            <p className="text-3xl text-sky-500">Get started</p>
            <p className="text-md font-semibold text-sky-400">
              Create a new account
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
            Display Name
          </p>

          <input
            type="text"
            placeholder="Johnny"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div>
          <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
            Username
          </p>

          <input
            type="text"
            placeholder="john"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        {emailEnabled ? (
          <div>
            <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
              Email
            </p>

            <input
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>
        ) : undefined}

        <div className="flex item-center gap-2">
          <div className="w-full">
            <p className="text-sm text-sky-500 w-fit font-semibold  mb-1">
              Password
            </p>

            <input
              type="password"
              placeholder="••••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          <div className="w-full">
            <p className="text-sm text-sky-500 w-fit font-semibold mb-1">
              Confirm Password
            </p>

            <input
              type="password"
              placeholder="••••••••••••••"
              value={form.passwordConfirmation}
              onChange={(e) =>
                setForm({ ...form, passwordConfirmation: e.target.value })
              }
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>
        </div>
        <SubmitButton
          onClick={registerUser}
          label="Sign Up"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500">Already have an account?</p>
          <Link href={"/login"} className="block text-sky-500 font-bold">
            Login
          </Link>
        </div>
      </div>
    </>
  );
}
