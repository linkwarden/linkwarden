import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";

export default function SettingsSidebar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const LINKWARDEN_VERSION = process.env.version;

  const { data: user } = useUser();

  const router = useRouter();
  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.asPath);
  }, [router]);

  return (
    <div
      className={`bg-base-100 h-full w-64 overflow-y-auto border-solid border border-base-100 border-r-neutral-content p-5 z-20 flex flex-col gap-5 justify-between ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <Link href="/settings/account">
          <div
            className={`${
              active === "/settings/account"
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-person text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("account")}</p>
          </div>
        </Link>

        <Link href="/settings/preference">
          <div
            className={`${
              active === "/settings/preference"
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-sliders text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("preference")}</p>
          </div>
        </Link>

        <Link href="/settings/rss-subscriptions">
          <div
            className={`${
              active === "/settings/rss-subscriptions"
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-rss text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">RSS Subscriptions</p>
          </div>
        </Link>

        <Link href="/settings/access-tokens">
          <div
            className={`${
              active === "/settings/access-tokens"
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-key text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("access_tokens")}</p>
          </div>
        </Link>

        <Link href="/settings/password">
          <div
            className={`${
              active === "/settings/password"
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-lock text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("password")}</p>
          </div>
        </Link>

        {process.env.NEXT_PUBLIC_STRIPE && !user.parentSubscriptionId && (
          <Link href="/settings/billing">
            <div
              className={`${
                active === "/settings/billing"
                  ? "bg-primary/20"
                  : "hover:bg-neutral/20"
              } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
            >
              <i className="bi-credit-card text-primary text-2xl"></i>
              <p className="truncate w-full pr-7">{t("billing")}</p>
            </div>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={`https://github.com/linkwarden/linkwarden/releases`}
          target="_blank"
          className="text-neutral text-sm ml-2 hover:opacity-50 duration-100"
        >
          {t("linkwarden_version", { version: LINKWARDEN_VERSION })}
        </Link>
        <Link href="https://docs.linkwarden.app" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-question-circle text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("help")}</p>
          </div>
        </Link>
        <Link href="https://github.com/linkwarden/linkwarden" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-github text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("github")}</p>
          </div>
        </Link>
        <Link href="https://twitter.com/LinkwardenHQ" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-twitter-x text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("twitter")}</p>
          </div>
        </Link>
        <Link href="https://fosstodon.org/@linkwarden" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-mastodon text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">{t("mastodon")}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
