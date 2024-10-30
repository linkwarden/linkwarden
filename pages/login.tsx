import Button from "@/components/ui/Button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { getLogins } from "./api/v1/logins";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import InstallApp from "@/components/InstallApp";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next.config";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/api/db";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

interface FormData {
  username: string;
  password: string;
}

export default function Login({
  availableLogins,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation();

  const router = useRouter();

  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    username: "",
    password: "",
  });

  async function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.username !== "" && form.password !== "") {
      setSubmitLoader(true);

      const load = toast.loading(t("authenticating"));

      const res = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      toast.dismiss(load);

      setSubmitLoader(false);

      if (!res?.ok) {
        toast.error(res?.error || t("invalid_credentials"));

        if (res?.error === "Email not verified.") {
          await signIn("email", {
            email: form.username,
            callbackUrl: "/",
            redirect: false,
          });

          router.push(
            `/confirmation?email=${encodeURIComponent(form.username)}`
          );
        }
      }
    } else {
      toast.error(t("fill_all_fields"));
    }
  }

  async function loginUserButton(method: string) {
    setSubmitLoader(true);

    const load = toast.loading(t("authenticating"));

    const res = await signIn(method, {});

    toast.dismiss(load);

    setSubmitLoader(false);
  }

  function displayLoginCredential() {
    if (availableLogins.credentialsEnabled === "true") {
      return (
        <>
          <p className="text-3xl text-black dark:text-white text-center font-extralight">
            {t("enter_credentials")}
          </p>
          <hr className="border-1 border-sky-100 dark:border-neutral-700" />

          {process.env.NEXT_PUBLIC_DEMO === "true" &&
            process.env.NEXT_PUBLIC_DEMO_USERNAME &&
            process.env.NEXT_PUBLIC_DEMO_PASSWORD && (
              <div className="p-3 shadow-lg border border-primary rounded-xl">
                <div className="flex flex-col gap-2 items-center text-center w-full">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-info h-6 w-6 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <p className="font-bold">{t("demo_title")}</p>
                  </div>
                  <div className="text-xs">{t("demo_desc")}</div>

                  <div className="text-xs">
                    {t("demo_desc_2")}{" "}
                    <a
                      href="https://cloud.linkwarden.app"
                      target="_blank"
                      className="font-bold"
                    >
                      cloud.linkwarden.app
                    </a>
                  </div>
                  <div
                    className="btn btn-sm btn-primary w-full"
                    onClick={async () => {
                      const load = toast.loading(t("authenticating"));

                      setForm({
                        username: process.env
                          .NEXT_PUBLIC_DEMO_USERNAME as string,
                        password: process.env
                          .NEXT_PUBLIC_DEMO_PASSWORD as string,
                      });
                      await signIn("credentials", {
                        username: process.env.NEXT_PUBLIC_DEMO_USERNAME,
                        password: process.env.NEXT_PUBLIC_DEMO_PASSWORD,
                        redirect: false,
                      });

                      toast.dismiss(load);
                    }}
                  >
                    {t("demo_button")}
                  </div>
                </div>
              </div>
            )}

          <div>
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              {availableLogins.emailEnabled === "true"
                ? t("username_or_email")
                : t("username")}
            </p>

            <TextInput
              autoFocus={true}
              placeholder="johnny"
              value={form.username}
              className="bg-base-100"
              data-testid="username-input"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="w-full">
            <p className="text-sm text-black dark:text-white w-fit font-semibold mb-1">
              {t("password")}
            </p>

            <TextInput
              type="password"
              placeholder="••••••••••••••"
              value={form.password}
              className="bg-base-100"
              data-testid="password-input"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {availableLogins.emailEnabled === "true" && (
              <div className="w-fit ml-auto mt-1">
                <Link
                  href={"/forgot"}
                  className="text-neutral font-semibold"
                  data-testid="forgot-password-link"
                >
                  {t("forgot_password")}
                </Link>
              </div>
            )}
          </div>
          <Button
            type="submit"
            size="full"
            intent="accent"
            data-testid="submit-login-button"
            loading={submitLoader}
          >
            {t("login")}
          </Button>

          {availableLogins.buttonAuths.length > 0 && (
            <div className="divider my-1">{t("or_continue_with")}</div>
          )}
        </>
      );
    }
  }

  function displayLoginExternalButton() {
    const Buttons: any = [];
    availableLogins.buttonAuths.forEach((value: any, index: any) => {
      Buttons.push(
        <React.Fragment key={index}>
          <Button
            type="button"
            onClick={() => loginUserButton(value.method)}
            size="full"
            intent="secondary"
            loading={submitLoader}
          >
            {value.name.toLowerCase() === "google" ||
              (value.name.toLowerCase() === "apple" && (
                <i className={"bi-" + value.name.toLowerCase()}></i>
              ))}
            {value.name}
          </Button>
        </React.Fragment>
      );
    });
    return Buttons;
  }

  function displayRegistration() {
    if (availableLogins.registrationDisabled !== "true") {
      return (
        <div className="flex items-baseline gap-1 justify-center">
          <p className="w-fit text-gray-500 dark:text-gray-400">
            {t("new_here")}
          </p>
          <Link
            href={"/register"}
            className="font-semibold"
            data-testid="register-link"
          >
            {t("sign_up")}
          </Link>
        </div>
      );
    }
  }

  return (
    <CenteredForm text={t("sign_in_to_your_account")}>
      <form onSubmit={loginUser}>
        <div
          className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100 dark:border-neutral-700"
          data-testid="login-form"
        >
          {displayLoginCredential()}
          {displayLoginExternalButton()}
          {displayRegistration()}
        </div>
      </form>
      <InstallApp />
    </CenteredForm>
  );
}

const getServerSideProps: GetServerSideProps = async (ctx) => {
  const availableLogins = getLogins();

  const acceptLanguageHeader = ctx.req.headers["accept-language"];
  const availableLanguages = i18n.locales;

  const token = await getToken({ req: ctx.req });

  if (token) {
    const user = await prisma.user.findUnique({
      where: {
        id: token.id,
      },
    });

    if (user) {
      return {
        props: {
          availableLogins,
          ...(await serverSideTranslations(user.locale ?? "en", ["common"])),
        },
      };
    }
  }

  const acceptedLanguages = acceptLanguageHeader
    ?.split(",")
    .map((lang) => lang.split(";")[0]);

  let bestMatch = acceptedLanguages?.find((lang) =>
    availableLanguages.includes(lang)
  );

  if (!bestMatch) {
    acceptedLanguages?.some((acceptedLang) => {
      const partialMatch = availableLanguages.find((lang) =>
        lang.startsWith(acceptedLang)
      );
      if (partialMatch) {
        bestMatch = partialMatch;
        return true;
      }
      return false;
    });
  }

  return {
    props: {
      availableLogins,
      ...(await serverSideTranslations(bestMatch ?? "en", ["common"])),
    },
  };
};

export { getServerSideProps };
