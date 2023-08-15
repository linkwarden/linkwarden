import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import React from "react";

export default function EmailConfirmaion() {
  return (
    <CenteredForm>
      <div className="p-4 sm:w-[30rem] w-80 rounded-2xl shadow-md m-auto border border-sky-100 dark:border-neutral-700 bg-slate-50 text-black dark:text-white dark:bg-neutral-800">
        <p className="text-center text-xl font-bold mb-2">
          Please check your Email
        </p>
        <p>A sign in link has been sent to your email address.</p>
        <p>You can safely close this page.</p>

        <hr className="my-5 dark:border-neutral-700" />

        <p className="text-sm text-gray-500 dark:text-gray-400">
          If you didn&apos;t receive anything, go to the{" "}
          <Link href="/forgot" className="font-bold underline">
            Password Recovery
          </Link>{" "}
          page and enter your Email to resend the sign in link.
        </p>
      </div>
    </CenteredForm>
  );
}
