import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import React from "react";

export default function EmailConfirmaion() {
  return (
    <CenteredForm>
      <div className="p-2 sm:w-[30rem] w-80 rounded-2xl shadow-md m-auto border border-sky-100 bg-slate-50 text-sky-800">
        <p className="text-center text-xl font-bold mb-2 text-black">
          Please check your Email
        </p>
        <p>A sign in link has been sent to your email address.</p>
        <p>You can safely close this page.</p>

        <hr className="my-5" />

        <p className="text-sm text-gray-500 ">
          If you didn't recieve anything, go to the{" "}
          <Link href="/forgot" className="font-bold">
            Password Recovery
          </Link>{" "}
          page and enter your Email to resend the sign in link.
        </p>
      </div>
    </CenteredForm>
  );
}
