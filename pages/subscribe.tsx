import SubmitButton from "@/components/SubmitButton";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Subscribe() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const { data, status } = useSession();
  const router = useRouter();

  async function loginUser() {
    setSubmitLoader(true);

    const redirectionToast = toast.loading("Redirecting to Stripe...");

    const res = await fetch("/api/payment");
    const data = await res.json();

    console.log(data);
    router.push(data.response);
  }

  return (
    <>
      <Image
        src="/linkwarden.png"
        width={518}
        height={145}
        alt="Linkwarden"
        className="h-12 w-fit mx-auto mt-10"
      />
      <p className="text-xl font-semibold text-sky-500 text-center px-2">
        {process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14} days free trial, then
        ${process.env.NEXT_PUBLIC_PRICING}/month afterwards
      </p>
      <div className="p-2 mt-10 mx-auto flex flex-col gap-3 justify-between sm:w-[30rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div>
          <p className="text-md text-gray-500 mt-1">
            You will be redirected to Stripe.
          </p>
          <p className="text-md text-gray-500 mt-1">
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
          className="w-fit mx-auto cursor-pointer text-gray-500 font-semibold "
        >
          Sign Out
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 my-10">
        © {new Date().getFullYear()} Linkwarden. All rights reserved.{" "}
      </p>
    </>
  );
}
