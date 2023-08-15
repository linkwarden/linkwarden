import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";

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
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "",
    username: emailEnabled ? undefined : "",
    email: emailEnabled ? "" : undefined,
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser() {
    const checkFields = () => {
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

    if (checkFields()) {
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
        if (form.email && emailEnabled)
          await signIn("email", {
            email: form.email,
            callbackUrl: "/",
          });
        else if (!emailEnabled) router.push("/login");

        toast.success("User Created!");
      } else {
        toast.error(data.response);
      }
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <CenteredForm
      text={
        process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE
          ? `Start using our Premium Services with a ${
              process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
            }-day free trial!`
          : "Create a new account"
      }
    >
      <div className="p-4 flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
        <p className="text-2xl text-black dark:text-white text-center font-bold">
          Enter your details
        </p>
        <div>
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Display Name
          </p>

          <input
            type="text"
            placeholder="Johnny"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 duration-100"
          />
        </div>

        {emailEnabled ? undefined : (
          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Username
            </p>

            <input
              type="text"
              placeholder="john"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 duration-100"
            />
          </div>
        )}

        {emailEnabled ? (
          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Email
            </p>

            <input
              type="email"
              placeholder="johnny@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 duration-100"
            />
          </div>
        ) : undefined}

        <div className="w-full">
          <p className="text-sm text-black dark:text-white w-fit font-semibold  mb-1">
            Password
          </p>

          <input
            type="password"
            placeholder="••••••••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 duration-100"
          />
        </div>

        <div className="w-full">
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Confirm Password
          </p>

          <input
            type="password"
            placeholder="••••••••••••••"
            value={form.passwordConfirmation}
            onChange={(e) =>
              setForm({ ...form, passwordConfirmation: e.target.value })
            }
            className="w-full rounded-md p-2 mx-auto border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 border-solid border outline-none focus:border-sky-700 dark:focus:border-sky-600 duration-100"
          />
        </div>

        {process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE ? (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing up, you agree to our{" "}
              <Link
                href="https://linkwarden.app/tos"
                className="font-semibold underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="https://linkwarden.app/privacy-policy"
                className="font-semibold underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need help?{" "}
              <Link
                href="mailto:support@linkwarden.app"
                className="font-semibold underline"
              >
                Get in touch
              </Link>
              .
            </p>
          </div>
        ) : undefined}

        <SubmitButton
          onClick={registerUser}
          label="Sign Up"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500 dark:text-gray-400">
            Already have an account?
          </p>
          <Link
            href={"/login"}
            className="block text-black dark:text-white font-bold"
          >
            Login
          </Link>
        </div>
      </div>
    </CenteredForm>
  );
}
