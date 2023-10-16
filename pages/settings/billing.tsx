import SettingsLayout from "@/layouts/SettingsLayout";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function billing() {
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE)
      router.push("/settings/profile");
  }, []);

  return (
    <SettingsLayout>
      <div>Billing</div>
    </SettingsLayout>
  );
}
