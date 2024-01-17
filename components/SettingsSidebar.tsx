import useCollectionStore from "@/store/collections";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function SettingsSidebar({ className }: { className?: string }) {
  const LINKWARDEN_VERSION = "v2.4.9";

  const { collections } = useCollectionStore();

  const router = useRouter();

  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.asPath);
  }, [router, collections]);

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
              active === `/settings/account`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-person text-primary text-2xl"></i>

            <p className="truncate w-full pr-7">Account</p>
          </div>
        </Link>

        <Link href="/settings/appearance">
          <div
            className={`${
              active === `/settings/appearance`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-palette text-primary text-2xl"></i>

            <p className="truncate w-full pr-7">Appearance</p>
          </div>
        </Link>

        <Link href="/settings/archive">
          <div
            className={`${
              active === `/settings/archive`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-archive text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">Archive</p>
          </div>
        </Link>

        <Link href="/settings/api">
          <div
            className={`${
              active === `/settings/api`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-key text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">API Keys</p>
          </div>
        </Link>

        <Link href="/settings/password">
          <div
            className={`${
              active === `/settings/password`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-lock text-primary text-2xl"></i>
            <p className="truncate w-full pr-7">Password</p>
          </div>
        </Link>

        {process.env.NEXT_PUBLIC_STRIPE ? (
          <Link href="/settings/billing">
            <div
              className={`${
                active === `/settings/billing`
                  ? "bg-primary/20"
                  : "hover:bg-neutral/20"
              } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
            >
              <i className="bi-credit-card text-primary text-xl"></i>
              <p className="truncate w-full pr-7">Billing</p>
            </div>
          </Link>
        ) : undefined}
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={`https://github.com/linkwarden/linkwarden/releases`}
          target="_blank"
          className="text-neutral text-sm ml-2 hover:opacity-50 duration-100"
        >
          Linkwarden {LINKWARDEN_VERSION}
        </Link>
        <Link href="https://docs.linkwarden.app" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-question-circle text-primary text-xl"></i>

            <p className="truncate w-full pr-7">Help</p>
          </div>
        </Link>

        <Link href="https://github.com/linkwarden/linkwarden" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-github text-primary text-xl"></i>
            <p className="truncate w-full pr-7">GitHub</p>
          </div>
        </Link>

        <Link href="https://twitter.com/LinkwardenHQ" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-twitter-x text-primary text-xl"></i>
            <p className="truncate w-full pr-7">Twitter</p>
          </div>
        </Link>

        <Link href="https://fosstodon.org/@linkwarden" target="_blank">
          <div
            className={`hover:bg-neutral/20 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <i className="bi-mastodon text-primary text-xl"></i>
            <p className="truncate w-full pr-7">Mastodon</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
