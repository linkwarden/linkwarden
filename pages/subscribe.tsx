import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";
import { Plan } from "@/types/global";
import AccentSubmitButton from "@/components/AccentSubmitButton";

export default function Subscribe() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const session = useSession();

  const [plan, setPlan] = useState<Plan>(1);

  const router = useRouter();

  async function submit() {
    setSubmitLoader(true);

    const redirectionToast = toast.loading("Redirecting to Stripe...");

    const res = await fetch("/api/v1/payment?plan=" + plan);
    const data = await res.json();

    router.push(data.response);
  }

  return (
    <CenteredForm
      text={`Start with a ${
        process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
      }-day free trial, cancel anytime!`}
    >
      <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
        <p className="sm:text-3xl text-2xl text-center font-extralight">
          Subscribe to Linkwarden!
        </p>

        <div className="divider my-0"></div>

        <div>
          <p>
            You will be redirected to Stripe, feel free to reach out to us at{" "}
            <a className="font-semibold" href="mailto:support@linkwarden.app">
              support@linkwarden.app
            </a>{" "}
            in case of any issue.
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
            <p>Monthly</p>
          </button>

          <button
            onClick={() => setPlan(Plan.yearly)}
            className={`w-full duration-100 text-sm rounded-lg p-1 ${
              plan === Plan.yearly
                ? "text-white bg-sky-700 dark:bg-sky-700"
                : "hover:opacity-80"
            }`}
          >
            <p>Yearly</p>
          </button>
          <div className="absolute -top-3 -right-4 px-1 bg-red-500 text-sm text-white rounded-md rotate-[22deg]">
            25% Off
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center items-center">
          <p className="text-3xl">
            ${plan === Plan.monthly ? "4" : "3"}
            <span className="text-base text-neutral">/mo</span>
          </p>
          <p className="font-semibold">
            Billed {plan === Plan.monthly ? "Monthly" : "Yearly"}
          </p>
          <fieldset className="w-full flex-col flex justify-evenly px-4 pb-4 pt-1 rounded-md border border-neutral-content">
            <legend className="w-fit font-extralight px-2 border border-neutral-content rounded-md text-xl">
              Total
            </legend>

            <p className="text-sm">
              {process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS}-day free trial, then $
              {plan === Plan.monthly ? "4 per month" : "36 annually"}
            </p>
            <p className="text-sm">+ VAT if applicable</p>
          </fieldset>
        </div>

        <AccentSubmitButton
          type="button"
          label="Complete Subscription!"
          className="w-full"
          onClick={submit}
          loading={submitLoader}
        />

        <div
          onClick={() => signOut()}
          className="w-fit mx-auto cursor-pointer text-neutral font-semibold "
        >
          Sign Out
        </div>
      </div>
    </CenteredForm>
  );
}
