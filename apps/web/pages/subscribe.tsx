import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";
import { Plan } from "@linkwarden/types";
import { Button } from "@/components/ui/button";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { Trans, useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TRIAL_PERIOD_DAYS =
  Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS) || 14;
const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

export default function Subscribe() {
  const { t } = useTranslation();
  const [submitLoader, setSubmitLoader] = useState(false);
  const session = useSession();

  const [plan, setPlan] = useState<Plan>(1);

  const router = useRouter();

  const { data: user } = useUser();

  const [daysLeft, setDaysLeft] = useState<number>(0);

  useEffect(() => {
    if (user?.createdAt) {
      const trialEndTime =
        new Date(user.createdAt).getTime() +
        (1 + Number(TRIAL_PERIOD_DAYS)) * 86400000; // Add 1 to account for the current day

      setDaysLeft(Math.floor((trialEndTime - Date.now()) / 86400000));
    }
  }, [user]);

  useEffect(() => {
    if (
      session.status === "authenticated" &&
      user?.id &&
      (user?.subscription?.active || user?.parentSubscription?.active)
    )
      router.push("/dashboard");
  }, [session.status, user]);

  async function submit() {
    setSubmitLoader(true);

    const redirectionToast = toast.loading(t("redirecting_to_stripe"));

    const res = await fetch("/api/v1/payment?plan=" + plan);
    const data = await res.json();

    router.push(data.response);

    toast.dismiss(redirectionToast);
  }

  return (
    <CenteredForm
      text={
        daysLeft <= 0
          ? "Your free trial has ended, subscribe to continue."
          : `You have ${REQUIRE_CC ? 14 : daysLeft || 0} ${
              !REQUIRE_CC && daysLeft === 1 ? "day" : "days"
            } left in your free trial.`
      }
    >
      <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-xl shadow-md border border-neutral-content">
        <p className="sm:text-3xl text-xl text-center font-extralight">
          {t("subscribe_title")}
        </p>

        <Separator />

        <div>
          <p>
            <Trans
              i18nKey="subscribe_desc"
              components={[
                <a
                  className="font-semibold"
                  href="mailto:support@linkwarden.app"
                  key={0}
                />,
              ]}
            />
          </p>
        </div>

        <div className="flex gap-3 border border-solid border-neutral-content w-4/5 mx-auto p-1 rounded-xl relative">
          <button
            onClick={() => setPlan(Plan.monthly)}
            className={`w-full duration-100 text-sm rounded-lg p-1 ${
              plan === Plan.monthly
                ? "text-white bg-sky-700 dark:bg-sky-700"
                : "hover:opacity-80"
            }`}
          >
            <p>{t("monthly")}</p>
          </button>

          <button
            onClick={() => setPlan(Plan.yearly)}
            className={`w-full duration-100 text-sm rounded-lg p-1 ${
              plan === Plan.yearly
                ? "text-white bg-sky-700 dark:bg-sky-700"
                : "hover:opacity-80"
            }`}
          >
            <p>{t("yearly")}</p>
          </button>
          <div className="absolute -top-3 -right-4 px-1 bg-red-600 text-sm text-white rounded-md rotate-[22deg]">
            {t("discount_percent", {
              percent: 25,
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center items-center">
          <p className="text-3xl">
            ${plan === Plan.monthly ? "4" : "3"}
            <span className="text-base text-neutral">/mo</span>
          </p>
          <p className="font-semibold">
            {plan === Plan.monthly ? t("billed_monthly") : t("billed_yearly")}
          </p>
          <fieldset className="w-full flex-col flex justify-evenly px-4 pb-4 pt-1 rounded-md border border-neutral-content">
            <legend className="w-fit font-extralight px-2 border border-neutral-content rounded-md text-xl">
              {t("total")}
            </legend>

            <p className="text-sm">
              {plan === Plan.monthly
                ? t("total_monthly_desc", {
                    count: REQUIRE_CC ? 14 : daysLeft,
                    monthlyPrice: "4",
                  })
                : t("total_annual_desc", {
                    count: REQUIRE_CC ? 14 : daysLeft,
                    annualPrice: "36",
                  })}
            </p>
            <p className="text-sm">{t("plus_tax")}</p>
          </fieldset>
        </div>

        <div
          className={cn(
            "flex gap-3 flex-col",
            REQUIRE_CC || daysLeft <= 0 ? "" : "sm:flex-row-reverse"
          )}
        >
          <Button
            type="button"
            variant="accent"
            size="full"
            onClick={submit}
            disabled={submitLoader}
          >
            {t("complete_subscription")}
          </Button>

          {REQUIRE_CC || daysLeft <= 0 ? (
            <div
              onClick={() => signOut()}
              className="w-fit mx-auto cursor-pointer text-neutral font-semibold "
            >
              {t("sign_out")}
            </div>
          ) : (
            <Button
              className=""
              variant="metal"
              size="full"
              onClick={() => router.push("/dashboard")}
            >
              {t("subscribe_later")}
            </Button>
          )}
        </div>
      </div>
    </CenteredForm>
  );
}

export { getServerSideProps };
