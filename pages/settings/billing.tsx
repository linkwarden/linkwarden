import SettingsLayout from "@/layouts/SettingsLayout";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Billing() {
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE) router.push("/settings/profile");
  }, []);

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">Billing Settings</p>

      <div className="divider my-3"></div>

      <div className="w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-md">
          To manage/cancel your subscription, visit the{" "}
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL}
            className="underline"
          >
            Billing Portal
          </a>
          .
        </p>

        <p className="text-md">
          If you still need help or encountered any issues, feel free to reach
          out to us at:{" "}
          <a
            className="font-semibold underline"
            href="mailto:support@linkwarden.app"
          >
            support@linkwarden.app
          </a>
        </p>
      </div>
    </SettingsLayout>
  );
}
