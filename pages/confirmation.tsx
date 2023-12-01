import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import React from "react";

export default function EmailConfirmaion() {
  return (
    <CenteredForm>
      <div className="p-4 max-w-[30rem] min-w-80 w-full rounded-2xl shadow-md mx-auto border border-neutral-content bg-base-200">
        <p className="text-center text-2xl sm:text-3xl font-extralight mb-2 ">
          Please check your Email
        </p>

        <div className="divider my-3"></div>

        <p>A sign in link has been sent to your email address.</p>

        <p className="mt-3">
          Didn&apos;t see the email? Check your spam folder or visit the{" "}
          <Link href="/forgot" className="font-bold underline">
            Password Recovery
          </Link>{" "}
          page to resend the link.
        </p>
      </div>
    </CenteredForm>
  );
}
