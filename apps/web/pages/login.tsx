import { Button } from "@/components/ui/button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/components/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { getLogins } from "./api/v1/logins";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next.config";
import { getToken } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@linkwarden/router/config";

interface FormData {
  username: string;
  password: string;
}

export default function Login({
  availableLogins,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation();

  const router = useRouter();

  const { data: config } = useConfig();

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

    await signIn(method, {});

    toast.dismiss(load);

    setSubmitLoader(false);
  }

  function displayLoginCredential() {
    if (availableLogins.credentialsEnabled === "true") {
      return (
        <>
          {config?.DEMO &&
            config?.DEMO_USERNAME &&
            config?.DEMO_PASSWORD && (
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
                  <Button
                    variant="primary"
                    size="full"
                    onClick={async () => {
                      const load = toast.loading(t("authenticating"));

                      setForm({
                        username: config?.DEMO_USERNAME as string,
                        password: config?.DEMO_PASSWORD as string,
                      });
                      await signIn("credentials", {
                        username: config?.DEMO_USERNAME,
                        password: config?.DEMO_PASSWORD,
                        redirect: false,
                      });

                      toast.dismiss(load);
                    }}
                  >
                    {t("demo_button")}
                  </Button>
                </div>
              </div>
            )}

          <div>
            <TextInput
              name="username"
              autoFocus={true}
              placeholder={
                availableLogins.emailEnabled === "true"
                  ? t("username_or_email")
                  : t("username")
              }
              value={form.username}
              className="bg-base-100"
              data-testid="username-input"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="w-full">
            <TextInput
              type="password"
              placeholder={t("password")}
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
            variant="accent"
            data-testid="submit-login-button"
            disabled={submitLoader}
          >
            {t("login")}
          </Button>

          {availableLogins.buttonAuths.length > 0 && (
            <div className="flex items-center gap-2">
              <Separator className="my-1 flex-1 w-auto" />
              <p className="whitespace-nowrap">{t("or")}</p>
              <Separator className="my-1 flex-1 w-auto" />
            </div>
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
            variant="metal"
            disabled={submitLoader}
          >
            {value.name.toLowerCase() === "google" ? (
              <>
                <i className={"bi-google"}></i>
                {t("continue_with_google")}
              </>
            ) : value.name.toLowerCase() === "apple" ? (
              <>
                <i className={"bi-apple"}></i>
                {t("continue_with_apple")}
              </>
            ) : (
              value.name
            )}
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
    <CenteredForm header={t("sign_in_to_linkwarden")}>
      <form onSubmit={loginUser}>
        <div
          className="mx-auto flex flex-col gap-3 justify-between max-w-md min-w-80 w-full"
          data-testid="login-form"
        >
          {displayLoginCredential()}
          {displayLoginExternalButton()}
          {displayRegistration()}
        </div>
      </form>
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
