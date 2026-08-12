import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import CenteredForm from "@/components/CenteredForm";
import { Button } from "@/components/ui/button";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useConfig } from "@linkwarden/router/config";

export default function Verify() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const { data: config } = useConfig();

  const MOBILE_APP_REDIRECT_ENABLED = Boolean(
    config?.MOBILE_APP_REDIRECT_ENABLED
  );

  const token =
    typeof router.query.token === "string" ? router.query.token : "";
  const email =
    typeof router.query.email === "string" ? router.query.email : "";

  const webUrl = `/api/v1/auth/callback/email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  const appUrl = () =>
    `linkwarden://verify-email?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}&instance=${encodeURIComponent(
      window.location.origin
    )}`;

  useEffect(() => {
    if (!router.isReady || !config) return;

    if (!token || !email) {
      router.push("/login");
      return;
    }

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    if (mobile && MOBILE_APP_REDIRECT_ENABLED) {
      window.location.href = appUrl();
    } else {
      window.location.replace(webUrl);
    }
  }, [router.isReady, config]);

  if (isMobile && MOBILE_APP_REDIRECT_ENABLED)
    return (
      <CenteredForm header={t("verify_your_email")}>
        <div className="max-w-[30rem] min-w-80 w-full mx-auto flex flex-col gap-3">
          <Button
            variant="accent"
            onClick={() => (window.location.href = appUrl())}
          >
            {t("open_in_the_app")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => (window.location.href = webUrl)}
          >
            {t("continue_in_browser")}
          </Button>
        </div>
      </CenteredForm>
    );
  else <></>;
}

export { getServerSideProps };
