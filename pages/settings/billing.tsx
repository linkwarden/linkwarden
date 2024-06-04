import SettingsLayout from "@/layouts/SettingsLayout";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function Billing() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE) router.push("/settings/profile");
  }, []);

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("billing_settings")}
      </p>

      <div className="divider my-3"></div>

      <div className="w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-md">
          {t("manage_subscription_intro")}{" "}
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL}
            className="underline"
            target="_blank"
          >
            {t("billing_portal")}
          </a>
          .
        </p>

        <p className="text-md">
          {t("help_contact_intro")}{" "}
          <a className="font-semibold" href="mailto:support@linkwarden.app">
            support@linkwarden.app
          </a>
        </p>
      </div>
    </SettingsLayout>
  );
}

export { getServerSideProps };
