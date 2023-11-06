import Link from "next/link";
import { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";
import TextInput from "@/components/TextInput";

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

  async function registerUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
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

        const response = await fetch("/api/v1/users", {
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
  }

  return (
    <CenteredForm
      text={
        process.env.NEXT_PUBLIC_STRIPE
          ? `Unlock ${
              process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
            } days of Premium Service at no cost!`
          : "Create a new account"
      }
    >
      {process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true" ? (
        <div className="p-4 flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
          <p>
            Registration is disabled for this instance, please contact the admin
            in case of any issues.
          </p>
        </div>
      ) : (
        <form onSubmit={registerUser}>
          <div className="p-4 flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full mx-auto bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
            <p className="text-3xl text-black dark:text-white text-center font-extralight">
              Enter your details
            </p>

            <hr className="border-1 border-sky-100 dark:border-neutral-700" />

            <div>
              <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
                Display Name
              </p>

              <TextInput
                autoFocus={true}
                placeholder="Johnny"
                value={form.name}
                className="bg-white"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {emailEnabled ? undefined : (
              <div>
                <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
                  Username
                </p>

                <TextInput
                  placeholder="john"
                  value={form.username}
                  className="bg-white"
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
            )}

            {emailEnabled ? (
              <div>
                <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
                  Email
                </p>

                <TextInput
                  type="email"
                  placeholder="johnny@example.com"
                  value={form.email}
                  className="bg-white"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            ) : undefined}

            <div className="w-full">
              <p className="text-sm text-black dark:text-white w-fit font-semibold  mb-1">
                Password
              </p>

              <TextInput
                type="password"
                placeholder="••••••••••••••"
                value={form.password}
                className="bg-white"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="w-full">
              <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
                Confirm Password
              </p>

              <TextInput
                type="password"
                placeholder="••••••••••••••"
                value={form.passwordConfirmation}
                className="bg-white"
                onChange={(e) =>
                  setForm({ ...form, passwordConfirmation: e.target.value })
                }
              />
            </div>

            {process.env.NEXT_PUBLIC_STRIPE ? (
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

            <button
              type="submit"
              className={`border primary-btn-gradient select-none duration-100 bg-black border-[#0071B7] hover:border-[#059bf8] rounded-lg text-center px-4 py-2 text-slate-200 hover:text-white `}
            >
              <p className="text-center w-full font-bold">Sign Up</p>
            </button>
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
        </form>
      )}
    </CenteredForm>
  );
}
