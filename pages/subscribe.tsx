import SubmitButton from "@/components/SubmitButton";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CenteredForm from "@/layouts/CenteredForm";

export default function Subscribe() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const { data, status } = useSession();
  const router = useRouter();

  async function loginUser() {
    setSubmitLoader(true);

    const redirectionToast = toast.loading("Redirecting to Stripe...");

    const res = await fetch("/api/payment");
    const data = await res.json();

    router.push(data.response);
  }

  return (
    <CenteredForm
      text={`${
        process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14
      }-Day free trial, then $${
        process.env.NEXT_PUBLIC_PRICING
      }/month afterwards`}
    >
      <div className="p-2 mx-auto flex flex-col gap-3 justify-between sm:w-[30rem] dark:border-neutral-700 w-80 bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100">
        <p className="text-2xl text-center font-bold">
          Subscribe to Linkwarden!
        </p>

        <div>
          <p>You will be redirected to Stripe.</p>
          <p>
            Feel free to reach out to us at{" "}
            <a className="font-semibold" href="mailto:support@linkwarden.app">
              support@linkwarden.app
            </a>{" "}
            in case of any issues.
          </p>
        </div>

        <SubmitButton
          onClick={loginUser}
          label="Complete your Subscription"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />

        <div
          onClick={() => signOut()}
          className="w-fit mx-auto cursor-pointer text-gray-500 dark:text-gray-400 font-semibold "
        >
          Sign Out
        </div>
      </div>
    </CenteredForm>
  );
}
