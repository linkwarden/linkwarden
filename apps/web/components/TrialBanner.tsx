import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";

export default function TrialBanner() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const { data: config } = useConfig();

  const STRIPE_ENABLED = Boolean(config?.STRIPE_ENABLED);
  const TRIAL_PERIOD_DAYS = config?.TRIAL_PERIOD_DAYS || 14;

  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [isTrialing, setIsTrialing] = useState<boolean>(false);

  useEffect(() => {
    if (user?.createdAt) {
      const trialEndTime =
        new Date(user.createdAt).getTime() +
        (1 + Number(TRIAL_PERIOD_DAYS)) * 86400000; // Add 1 to account for the current day

      setDaysLeft(Math.floor((trialEndTime - Date.now()) / 86400000));
    }
  }, [user, config]);

  useEffect(() => {
    const isTrialing =
      user?.id &&
      !user?.subscription?.active &&
      !user.parentSubscription?.active;

    setIsTrialing(Boolean(isTrialing));
  }, [user, daysLeft]);

  if (!STRIPE_ENABLED || !isTrialing) return null;

  return (
    <Link
      href="/subscribe"
      className="w-full text-sm cursor-pointer select-none bg-base-200"
    >
      <p className="w-full text-center flex items-center justify-center gap-1 underline decoration-dotted underline-offset-4 hover:opacity-70 duration-200 py-1 px-2">
        <i className="bi-clock text-primary" />
        {daysLeft === 1
          ? t("trial_left_singular")
          : t("trial_left_plural", { count: daysLeft })}
      </p>
    </Link>
  );
}
