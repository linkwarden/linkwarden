import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPalette,
  faBoxArchive,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  faCircleQuestion,
  faCreditCard,
} from "@fortawesome/free-regular-svg-icons";
import {
  faGithub,
  faMastodon,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

export default function SettingsSidebar({ className }: { className?: string }) {
  const { collections } = useCollectionStore();

  const router = useRouter();

  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.asPath);
  }, [router, collections]);

  return (
    <div
      className={`dark:bg-neutral-900 bg-white h-full w-64 overflow-y-auto border-solid border-white border dark:border-neutral-900 border-r-sky-100 dark:border-r-neutral-700 p-5 z-20 flex flex-col gap-5 justify-between ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <Link href="/settings/account">
          <div
            className={`${
              active === `/settings/account`
                ? "bg-sky-200 dark:bg-sky-800"
                : "hover:bg-slate-200 hover:dark:bg-neutral-700"
            } duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faUser}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Account
            </p>
          </div>
        </Link>

        <Link href="/settings/appearance">
          <div
            className={`${
              active === `/settings/appearance`
                ? "bg-sky-200 dark:bg-sky-800"
                : "hover:bg-slate-200 hover:dark:bg-neutral-700"
            } duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faPalette}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Appearance
            </p>
          </div>
        </Link>

        <Link href="/settings/archive">
          <div
            className={`${
              active === `/settings/archive`
                ? "bg-sky-200 dark:bg-sky-800"
                : "hover:bg-slate-200 hover:dark:bg-neutral-700"
            } duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faBoxArchive}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Archive
            </p>
          </div>
        </Link>

        <Link href="/settings/password">
          <div
            className={`${
              active === `/settings/password`
                ? "bg-sky-200 dark:bg-sky-800"
                : "hover:bg-slate-200 hover:dark:bg-neutral-700"
            } duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faKey}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Password
            </p>
          </div>
        </Link>

        {process.env.NEXT_PUBLIC_STRIPE ? (
          <Link href="/settings/billing">
            <div
              className={`${
                active === `/settings/billing`
                  ? "bg-sky-200 dark:bg-sky-800"
                  : "hover:bg-slate-200 hover:dark:bg-neutral-700"
              } duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
            >
              <FontAwesomeIcon
                icon={faCreditCard}
                className="w-6 h-6 text-sky-500 dark:text-sky-500"
              />

              <p className="text-black dark:text-white truncate w-full pr-7">
                Billing
              </p>
            </div>
          </Link>
        ) : undefined}
      </div>

      <div className="flex flex-col gap-1">
        <Link href="https://docs.linkwarden.app" target="_blank">
          <div
            className={`hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faCircleQuestion as any}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Help
            </p>
          </div>
        </Link>

        <Link href="https://github.com/linkwarden/linkwarden" target="_blank">
          <div
            className={`hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faGithub as any}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              GitHub
            </p>
          </div>
        </Link>

        <Link href="https://twitter.com/LinkwardenHQ" target="_blank">
          <div
            className={`hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faXTwitter as any}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Twitter
            </p>
          </div>
        </Link>

        <Link href="https://fosstodon.org/@linkwarden" target="_blank">
          <div
            className={`hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 py-2 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faMastodon as any}
              className="w-6 h-6 text-sky-500 dark:text-sky-500"
            />

            <p className="text-black dark:text-white truncate w-full pr-7">
              Mastodon
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
