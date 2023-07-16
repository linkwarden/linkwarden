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

  useEffect(() => {
    console.log(data?.user);
  }, [status]);

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
      <div className="p-2 mt-10 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="flex flex-col gap-2 sm:flex-row justify-between items-center mb-5">
          <Image
            src="/linkwarden.png"
            width={1694}
            height={483}
            alt="Linkwarden"
            className="h-12 w-fit"
          />
          <div className="text-center sm:text-right">
            <p className="text-3xl text-sky-500">14 days free trial</p>
            <p className="text-md font-semibold text-sky-400">
              Then $5/month afterwards
            </p>
          </div>
        </div>

        <div>
          <p className="text-md text-gray-500 mt-1">
            You will be redirected to Stripe.
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
    </>
  );
}
