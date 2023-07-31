import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import Image from "next/image";

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

type FormData = {
  name: string;
  username?: string;
  email?: string;
  password: string;
  passwordConfirmation: string;
};

export default function Register() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    username: emailEnabled ? undefined : "",
    email: emailEnabled ? "" : undefined,
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser() {
    const checkHasEmptyFields = () => {
      if (emailEnabled) {
        return (
          form.name !== "" &&
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
      if (form.password !== form.passwordConfirmation)
        return toast.error("Passwords do not match.");
      else if (form.password.length < 8)
        return toast.error("Passwords must be at least 8 characters.");
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
      <p className="text-center px-2 text-xl font-semibold text-sky-700">
        {process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE
          ? `Start using our premium services with a ${
              process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
            }-day free trial!`
          : "Create a new account"}
      </p>
      <div className="p-2 mx-auto my-10 flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <p className="text-xl text-sky-700 w-fit font-bold">
          Enter your details
        </p>
        <div>
          <p className="text-sm text-sky-700 w-fit font-semibold mb-1">
            Display Name
          </p>

          <input
            type="text"
            placeholder="Johnny"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
          />
        </div>

        {emailEnabled ? undefined : (
          <div>
            <p className="text-sm text-sky-700 w-fit font-semibold mb-1">
              Username
            </p>

            <input
              type="text"
              placeholder="john"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
            />
          </div>
        )}

        {emailEnabled ? (
          <div>
            <p className="text-sm text-sky-700 w-fit font-semibold mb-1">
              Email
            </p>

            <input
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
            />
          </div>
        ) : undefined}

        <div className="flex item-center gap-2">
          <div className="w-full">
            <p className="text-sm text-sky-700 w-fit font-semibold  mb-1">
              Password
            </p>

            <input
              type="password"
              placeholder="••••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
            />
          </div>

          <div className="w-full">
            <p className="text-sm text-sky-700 w-fit font-semibold mb-1">
              Confirm Password
            </p>

            <input
              type="password"
              placeholder="••••••••••••••"
              value={form.passwordConfirmation}
              onChange={(e) =>
                setForm({ ...form, passwordConfirmation: e.target.value })
              }
              className="w-full rounded-md p-2 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
            />
          </div>
        </div>

        {process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE ? (
          <>
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{" "}
              <Link href="https://linkwarden.app/tos" className="font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="https://linkwarden.app/privacy-policy"
                className="font-semibold"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              Need help?{" "}
              <Link
                href="mailto:support@linkwarden.app"
                className="font-semibold"
              >
                Get in touch
              </Link>
              .
            </p>
          </>
        ) : undefined}

        <SubmitButton
          onClick={registerUser}
          label="Sign Up"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500">Already have an account?</p>
          <Link href={"/login"} className="block text-sky-700 font-bold">
            Login
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mb-10">
        © {new Date().getFullYear()} Linkwarden. All rights reserved.{" "}
      </p>
    </>
  );
}
