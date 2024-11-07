import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";
import { Plan } from "@/types/global";
import Button from "@/components/ui/Button";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { Trans, useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";

export default function Subscribe() {
  const { t } = useTranslation();
  const [submitLoader, setSubmitLoader] = useState(false);
  const session = useSession();

  const [plan, setPlan] = useState<Plan>(1);

  const router = useRouter();

  const { data: user = {} } = useUser();

  useEffect(() => {
    if (
      session.status === "authenticated" &&
      user.id &&
      (user?.subscription?.active || user.parentSubscription?.active)
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
      text={`Start with a ${
        process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
      }-day free trial, cancel anytime!`}
    >
      <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
        <p className="sm:text-3xl text-2xl text-center font-extralight">
          {t("subscribe_title")}
        </p>

        <div className="divider my-0"></div>

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
                    count: Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS),
                    monthlyPrice: "4",
                  })
                : t("total_annual_desc", {
                    count: Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS),
                    annualPrice: "36",
                  })}
            </p>
            <p className="text-sm">{t("plus_tax")}</p>
          </fieldset>
        </div>

        <Button
          type="button"
          intent="accent"
          size="full"
          onClick={submit}
          loading={submitLoader}
        >
          {t("complete_subscription")}
        </Button>

        <div
          onClick={() => signOut()}
          className="w-fit mx-auto cursor-pointer text-neutral font-semibold "
        >
          {t("sign_out")}
        </div>
      </div>
    </CenteredForm>
  );
}

export { getServerSideProps };
