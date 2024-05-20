import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function EmailConfirmaion() {
  const router = useRouter();

  const [submitLoader, setSubmitLoader] = useState(false);

  const resend = async () => {
    setSubmitLoader(true);

    const load = toast.loading("Authenticating...");

    const res = await signIn("email", {
      email: decodeURIComponent(router.query.email as string),
      callbackUrl: "/",
      redirect: false,
    });

    toast.dismiss(load);

    setSubmitLoader(false);

    toast.success("Verification email sent.");
  };

  return (
    <CenteredForm>
      <div className="p-4 max-w-[30rem] min-w-80 w-full rounded-2xl shadow-md mx-auto border border-neutral-content bg-base-200">
        <p className="text-center text-2xl sm:text-3xl font-extralight mb-2 ">
          Please check your Email
        </p>

        <div className="divider my-3"></div>

        <p>
          A sign in link has been sent to your email address. If you don't see
          the email, check your spam folder.
        </p>

        <div className="mx-auto w-fit mt-3">
          <div className="btn btn-ghost btn-sm" onClick={resend}>
            Resend Email
          </div>
        </div>
      </div>
    </CenteredForm>
  );
}
