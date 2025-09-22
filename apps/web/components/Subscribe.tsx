import { isPWA } from "@/lib/utils";
import React, { useState } from "react";
import { Trans } from "next-i18next";
import { Button } from "./ui/button";
import Link from "next/link";
import { useUser } from "@linkwarden/router/user";

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE === "true";
const TRIAL_PERIOD_DAYS = process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14;
const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

type Props = {};

const Subscribe = (props: Props) => {
  const [isOpen, setIsOpen] = useState(true);
  const { data: user } = useUser();

  const { daysLeft, hasInactiveSubscription } = React.useMemo(() => {
    const trialEndTime =
      new Date(user?.createdAt || 0).getTime() +
      (1 + Number(TRIAL_PERIOD_DAYS)) * 86400000; // Add 1 to account for the current day

    const daysLeft = Math.floor((trialEndTime - Date.now()) / 86400000);

    const hasInactiveSubscription =
      user?.id &&
      !user?.subscription?.active &&
      !user.parentSubscription?.active &&
      STRIPE_ENABLED;

    return { trialEndTime, daysLeft, hasInactiveSubscription };
  }, [user]);

  return isOpen && hasInactiveSubscription ? (
    <div className="fixed left-0 right-0 bottom-10 w-full px-5">
      <div className="mx-auto w-fit p-2 flex justify-between gap-2 items-center border border-neutral-content rounded-xl bg-base-300 backdrop-blur-md bg-opacity-80">
        <i className="bi bi-clock-history text-primary text-3xl"></i>
        <p className="text-[0.92rem] pr-2">
          <Trans
            i18nKey="trial_left_prompt"
            values={{ count: daysLeft }}
            components={[
              <Link
                className="text-primary font-bold"
                href="/subscribe"
                key={0}
              />,
            ]}
          />
        </p>
        <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon">
          <i className="bi-x text-xl"></i>
        </Button>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default Subscribe;
