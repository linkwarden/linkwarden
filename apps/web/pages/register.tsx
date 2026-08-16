import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import CenteredForm from "@/components/CenteredForm";
import TextInput from "@/components/TextInput";
import { Button } from "@/components/ui/button";
import { getLogins } from "./api/v1/logins";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next.config";
import { useTranslation } from "next-i18next";
import { useConfig } from "@linkwarden/router/config";
import { Separator } from "@/components/ui/separator";
import Checkbox from "@/components/Checkbox";

type FormData = {
  name: string;
  username?: string;
  email?: string;
  password: string;
  acceptPromotionalEmails: boolean;
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
    acceptPromotionalEmails: false,
  });

  async function registerUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
      const checkFields = () => {
        if (config?.EMAIL_PROVIDER) {
          return form.name !== "" && form.email !== "" && form.password !== "";
        } else {
          return (
            form.name !== "" && form.username !== "" && form.password !== ""
          );
        }
      };

      if (checkFields()) {
        if (form.password.length < 8)
          return toast.error(t("password_too_short"));
        const { ...request } = form;

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

    await signIn(method, {});

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

  return (
    <CenteredForm
      header={t("reimagine_how_you_save_links")}
      text={
        config?.STRIPE_ENABLED
          ? t("trial_offer_desc", {
              count: config?.TRIAL_PERIOD_DAYS || 14,
            })
          : t("register_desc")
      }
      data-testid="registration-form"
    >
      {config?.DISABLE_REGISTRATION ? (
        <div className="flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full">
          <p>{t("registration_disabled")}</p>
        </div>
      ) : (
        <form onSubmit={registerUser}>
          <div className="flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full mx-auto">
            <div>
              <TextInput
                autoFocus={true}
                placeholder={t("display_name")}
                value={form.name}
                className="bg-base-100"
                data-testid="display-name-input"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {config?.EMAIL_PROVIDER ? undefined : (
              <div>
                <TextInput
                  placeholder={t("username")}
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
                <TextInput
                  type="email"
                  placeholder={t("email")}
                  value={form.email}
                  className="bg-base-100"
                  data-testid="email-input"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            )}

            <div className="w-full">
              <TextInput
                type="password"
                placeholder={t("password")}
                value={form.password}
                className="bg-base-100"
                data-testid="password-input"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {config?.STRIPE_ENABLED && (
              <>
                <Checkbox
                  className="p-0"
                  label={t("accept_promotional_emails")}
                  state={form.acceptPromotionalEmails}
                  onClick={(e) =>
                    setForm({
                      ...form,
                      acceptPromotionalEmails: e.target.checked,
                    })
                  }
                />
              </>
            )}

            <Button
              type="submit"
              variant="accent"
              disabled={submitLoader}
              size="full"
              data-testid="register-button"
            >
              {t("sign_up")}
            </Button>

            {availableLogins.buttonAuths.length > 0 && (
              <div className="flex items-center gap-2">
                <Separator className="my-1 flex-1 w-auto" />
                <p className="whitespace-nowrap">{t("or")}</p>
                <Separator className="my-1 flex-1 w-auto" />
              </div>
            )}

            {displayLoginExternalButton()}

            {config?.STRIPE_ENABLED && (
              <div className="text-xs text-neutral text-center">
                <p>
                  By continuing, you agree to our{" "}
                  <Link
                    href="https://linkwarden.app/tos"
                    className="underline"
                    data-testid="terms-of-service-link"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="https://linkwarden.app/privacy-policy"
                    className="underline"
                    data-testid="privacy-policy-link"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            )}

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
              {config?.STRIPE_ENABLED && (
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
