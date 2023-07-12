import { signIn } from "next-auth/react";
import React from "react";

export default function EmailConfirmaion({ email }: { email: string }) {
  return (
    <div className="overflow-y-auto py-2 fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
      <div className="mx-auto p-3 rounded-xl border border-sky-100 shadow-lg bg-gray-100 text-sky-800">
        <p className="text-center text-2xl mb-2">Please check your email</p>
        <p>A sign in link has been sent to your email address.</p>
        <div
          onClick={() =>
            signIn("email", {
              email,
              redirect: false,
            })
          }
          className="mx-auto font-semibold mt-2 cursor-pointer w-fit"
        >
          Resend?
        </div>
      </div>
    </div>
  );
}
