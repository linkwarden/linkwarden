import AccentSubmitButton from "@/components/AccentSubmitButton";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState, FormEvent, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Capacitor } from "@capacitor/core";
import sendLoginRequest from "@/lib/client/sendLoginRequest";

interface FormData {
  baseURL: string;
  username: string;
  password: string;
}

interface AvailableLogins {
  credentialsEnabled: string;
  emailEnabled: string;
  buttonAuths: Array<{
    method: string;
    name: string;
  }>;
  registrationDisabled: string;
}

export default function Login() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const [availableLogins, setAvailableLogins] =
    useState<AvailableLogins | null>(null);

  const [form, setForm] = useState<FormData>({
    baseURL: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    async function fetchLogins() {
      try {
        const response = await fetch("http://localhost:3000/api/v1/logins");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setAvailableLogins(data);
      } catch (error) {
        console.error("Failed to fetch available logins:", error);
      }
    }

    Capacitor.isNativePlatform() ? undefined : fetchLogins();
  }, []);

  async function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      form.username !== "" &&
      form.password !== "" &&
      (Capacitor.isNativePlatform() ? form.baseURL : true)
    ) {
      setSubmitLoader(true);

      const load = toast.loading("Authenticating...");

      const response = await sendLoginRequest(form);

      toast.dismiss(load);

      setSubmitLoader(false);

      if (response?.status !== 200) {
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
    return availableLogins?.credentialsEnabled === "false" ? null : (
      <>
        <p className="text-3xl text-black dark:text-white text-center font-extralight">
          Enter your credentials
        </p>
        <hr className="border-1 border-sky-100 dark:border-neutral-700" />
        {Capacitor.isNativePlatform() ? (
          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              Instance URL
            </p>

            <TextInput
              autoFocus={true}
              placeholder="https://cloud.linkwarden.app"
              value={form.baseURL}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
            />
          </div>
        ) : undefined}
        <div>
          <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
            Username
            {availableLogins?.emailEnabled === "true" ? " or Email" : undefined}
          </p>

          <TextInput
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
          {availableLogins?.emailEnabled === "true" &&
            !Capacitor.isNativePlatform() && (
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

        {availableLogins && availableLogins.buttonAuths.length > 0 ? (
          <div className="divider my-1">OR</div>
        ) : undefined}
      </>
    );
  }
  function displayLoginExternalButton() {
    const Buttons: any = [];
    availableLogins?.buttonAuths.forEach((value, index) => {
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
    if (availableLogins?.registrationDisabled !== "true") {
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
          {Capacitor.isNativePlatform() ? undefined : displayRegistration()}
        </div>
      </form>
    </CenteredForm>
  );
}
