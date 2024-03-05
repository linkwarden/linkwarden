import AccentSubmitButton from "@/components/AccentSubmitButton";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { getLogins } from "./api/v1/logins";
import { InferGetServerSidePropsType } from "next";

interface FormData {
  username: string;
  password: string;
}

export const getServerSideProps = () => {
  const availableLogins = getLogins();
  return { props: { availableLogins } };
};

export default function Login({
  availableLogins,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
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

  async function loginUserButton(method: string) {
    setSubmitLoader(true);

    const load = toast.loading("Authenticating...");

    const res = await signIn(method, {});

    toast.dismiss(load);

    setSubmitLoader(false);
  }

  function displayLoginCredential() {
    if (availableLogins.credentialsEnabled === "true") {
      return (
        <>
          <p className="text-3xl text-black dark:text-white text-center font-extralight">
            Enter your credentials
          </p>
          <hr className="border-1 border-sky-100 dark:border-neutral-700" />
          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Username
              {availableLogins.emailEnabled === "true"
                ? " or Email"
                : undefined}
            </p>

            <TextInput
              autoFocus={true}
              placeholder="johnny"
              value={form.username}
              className="bg-base-100"
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
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {availableLogins.emailEnabled === "true" && (
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
          <AccentSubmitButton
            type="submit"
            label="Login"
            className=" w-full text-center"
            loading={submitLoader}
          />

          {availableLogins.buttonAuths.length > 0 ? (
            <div className="divider my-1">OR</div>
          ) : undefined}
        </>
      );
    }
  }
  function displayLoginExternalButton() {
    const Buttons: any = [];
    availableLogins.buttonAuths.forEach((value, index) => {
      Buttons.push(
        <React.Fragment key={index}>
          {index !== 0 ? <div className="divider my-1">OR</div> : undefined}

          <AccentSubmitButton
            type="button"
            onClick={() => loginUserButton(value.method)}
            label={`Sign in with ${value.name}`}
            className=" w-full text-center"
            loading={submitLoader}
          />
        </React.Fragment>
      );
    });
    return Buttons;
  }

  function displayRegistration() {
    if (availableLogins.registrationDisabled !== "true") {
      return (
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500 dark:text-gray-400">New here?</p>
          <Link
            href={"/register"}
            className="block text-black dark:text-white font-semibold"
          >
            Sign Up
          </Link>
        </div>
      );
    }
  }

  return (
    <CenteredForm text="Sign in to your account">
      <form onSubmit={loginUser}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700">
          {displayLoginCredential()}
          {displayLoginExternalButton()}
          {displayRegistration()}
          <Link
            href="https://docs.linkwarden.app/getting-started/pwa-installation"
            className="underline text-center"
            target="_blank"
          >
            You can install Linkwarden onto your device
          </Link>
        </div>
      </form>
    </CenteredForm>
  );
}
