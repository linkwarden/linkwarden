import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";
import TextInput from "@/components/TextInput";
import Button from "@/components/ui/Button";
import { getLogins } from "./api/v1/logins";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/api/db";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next.config";
import { Trans, useTranslation } from "next-i18next";
import { useConfig } from "@/hooks/store/config";

type FormData = {
  name: string;
  username?: string;
  email?: string;
  password: string;
  passwordConfirmation: string;
};

export default function Register({
  availableLogins,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation();
  const [submitLoader, setSubmitLoader] = useState(false);
  const router = useRouter();

  const { data: config } = useConfig();

  const [form, setForm] = useState<FormData>({
    name: "",
    username: config?.EMAIL_PROVIDER ? undefined : "",
    email: config?.EMAIL_PROVIDER ? "" : undefined,
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
      const checkFields = () => {
        if (config?.EMAIL_PROVIDER) {
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
          return toast.error(t("passwords_mismatch"));
        else if (form.password.length < 8)
          return toast.error(t("password_too_short"));
        const { passwordConfirmation, ...request } = form;

        setSubmitLoader(true);

        const load = toast.loading(t("creating_account"));

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
          if (form.email && config?.EMAIL_PROVIDER) {
            await signIn("email", {
              email: form.email,
              callbackUrl: "/",
              redirect: false,
            });

            router.push(
              "/confirmation?email=" + encodeURIComponent(form.email)
            );
          } else if (!config?.EMAIL_PROVIDER) router.push("/login");

          toast.success(t("account_created"));
        } else {
          toast.error(data.response);
        }
      } else {
        toast.error(t("fill_all_fields"));
      }
    }
  }

  async function loginUserButton(method: string) {
    setSubmitLoader(true);

    const load = toast.loading(t("authenticating"));

    const res = await signIn(method, {});

    toast.dismiss(load);

    setSubmitLoader(false);
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

  return (
    <CenteredForm
      text={
        process.env.NEXT_PUBLIC_STRIPE
          ? t("trial_offer_desc", {
              count: Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14),
            })
          : t("register_desc")
      }
      data-testid="registration-form"
    >
      {config?.DISABLE_REGISTRATION ? (
        <div className="p-4 flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p>{t("registration_disabled")}</p>
        </div>
      ) : (
        <form onSubmit={registerUser}>
          <div className="p-4 flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full mx-auto bg-base-200 rounded-2xl shadow-md border border-neutral-content">
            <p className="text-3xl text-center font-extralight">
              {t("enter_details")}
            </p>

            <div className="divider my-0"></div>

            <div>
              <p className="text-sm w-fit font-semibold mb-1">
                {t("display_name")}
              </p>

              <TextInput
                autoFocus={true}
                placeholder="Johnny"
                value={form.name}
                className="bg-base-100"
                data-testid="display-name-input"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {config?.EMAIL_PROVIDER ? undefined : (
              <div>
                <p className="text-sm w-fit font-semibold mb-1">
                  {t("username")}
                </p>

                <TextInput
                  placeholder="john"
                  value={form.username}
                  className="bg-base-100"
                  data-testid="username-input"
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
            )}

            {config?.EMAIL_PROVIDER && (
              <div>
                <p className="text-sm w-fit font-semibold mb-1">{t("email")}</p>

                <TextInput
                  type="email"
                  placeholder="johnny@example.com"
                  value={form.email}
                  className="bg-base-100"
                  data-testid="email-input"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            )}

            <div className="w-full">
              <p className="text-sm w-fit font-semibold  mb-1">
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
            </div>

            <div className="w-full">
              <p className="text-sm w-fit font-semibold mb-1">
                {t("confirm_password")}
              </p>

              <TextInput
                type="password"
                placeholder="••••••••••••••"
                value={form.passwordConfirmation}
                className="bg-base-100"
                data-testid="password-confirm-input"
                onChange={(e) =>
                  setForm({ ...form, passwordConfirmation: e.target.value })
                }
              />
            </div>

            {process.env.NEXT_PUBLIC_STRIPE && (
              <div className="text-xs text-neutral mb-3">
                <p>
                  <Trans
                    i18nKey="sign_up_agreement"
                    components={[
                      <Link
                        href="https://linkwarden.app/tos"
                        className="font-semibold"
                        data-testid="terms-of-service-link"
                        key={0}
                      />,
                      <Link
                        href="https://linkwarden.app/privacy-policy"
                        className="font-semibold"
                        data-testid="privacy-policy-link"
                        key={1}
                      />,
                    ]}
                  />
                </p>
              </div>
            )}

            <Button
              type="submit"
              loading={submitLoader}
              intent="accent"
              size="full"
              data-testid="register-button"
            >
              {t("sign_up")}
            </Button>

            {availableLogins.buttonAuths.length > 0 && (
              <div className="divider my-1">{t("or_continue_with")}</div>
            )}

            {displayLoginExternalButton()}
            <div>
              <div className="text-neutral text-center flex items-baseline gap-1 justify-center">
                <p className="w-fit text-neutral">{t("already_registered")}</p>
                <Link
                  href={"/login"}
                  className="font-bold text-base-content"
                  data-testid="login-link"
                >
                  {t("login")}
                </Link>
              </div>
              {process.env.NEXT_PUBLIC_STRIPE && (
                <div className="text-neutral text-center flex items-baseline gap-1 justify-center">
                  <p>{t("need_help")}</p>
                  <Link
                    href="mailto:support@linkwarden.app"
                    className="font-bold text-base-content"
                    data-testid="support-link"
                  >
                    {t("get_in_touch")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
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
