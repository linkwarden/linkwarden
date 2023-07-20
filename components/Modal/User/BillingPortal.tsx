import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function PaymentPortal() {
  const [submitLoader, setSubmitLoader] = useState(false);
  const router = useRouter();

  const submit = () => {
    setSubmitLoader(true);
    const load = toast.loading("Redirecting to billing portal...");

    router.push(process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL as string);
  };

  return (
    <div className="mx-auto sm:w-[35rem] w-80">
      <div className="max-w-[25rem] w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-md text-gray-500">
          To manage/cancel your subsciption, visit the billing portal.
        </p>

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label="Go to Billing Portal"
          icon={faArrowUpRightFromSquare}
          className="mx-auto mt-2"
        />

        <p className="text-md text-gray-500">
          If you still need help or encountered any issues, feel free to reach
          out to us at:{" "}
          <a className="font-semibold" href="mailto:support@linkwarden.app">
            support@linkwarden.app
          </a>
        </p>
      </div>
    </div>
  );
}
