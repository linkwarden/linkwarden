import React, { useState } from "react";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const keycloakEnabled = process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true";
const authentikEnabled = process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === "true";

export default function Delete() {
  const [password, setPassword] = useState("");
  const [comment, setComment] = useState<string>();
  const [feedback, setFeedback] = useState<string>();

  const [submitLoader, setSubmitLoader] = useState(false);

  const { data } = useSession();

  const submit = async () => {
    const body = {
      password,
      cancellation_details: {
        comment,
        feedback,
      },
    };

    if (!keycloakEnabled && !authentikEnabled && password == "") {
      return toast.error("Please fill the required fields.");
    }

    setSubmitLoader(true);

    const load = toast.loading("Deleting everything, please wait...");

    const response = await fetch(`/api/v1/users/${data?.user.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const message = (await response.json()).response;

    toast.dismiss(load);

    if (response.ok) {
      signOut();
    } else toast.error(message);

    setSubmitLoader(false);
  };

  return (
    <CenteredForm>
      <div className="p-4 mx-auto relative flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 bg-base-200 rounded-2xl shadow-md border border-neutral-content">
        <Link
          href="/settings/account"
          className="absolute top-4 left-4 btn btn-ghost btn-square btn-sm"
        >
          <i className="bi-chevron-left  text-neutral text-xl"></i>
        </Link>
        <div className="flex items-center gap-2 w-full rounded-md h-8">
          <p className="text-red-500 dark:text-red-500 truncate w-full text-3xl text-center">
            Delete Account
          </p>
        </div>

        <div className="divider my-0"></div>

        <p>
          This will permanently delete all the Links, Collections, Tags, and
          archived data you own. It will also log you out
          {process.env.NEXT_PUBLIC_STRIPE
            ? " and cancel your subscription"
            : undefined}
          . This action is irreversible!
        </p>

        {process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED !== "true" ? (
          <div>
            <p className="mb-2">Confirm Your Password</p>

            <TextInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              className="bg-base-100"
              type="password"
            />
          </div>
        ) : undefined}

        {process.env.NEXT_PUBLIC_STRIPE ? (
          <fieldset className="border rounded-md p-2 border-primary">
            <legend className="px-3 py-1 text-sm sm:text-base border rounded-md border-primary">
              <b>Optional</b>{" "}
              <i className="min-[390px]:text-sm text-xs">
                (but it really helps us improve!)
              </i>
            </legend>
            <label className="w-full flex min-[430px]:items-center items-start gap-2 mb-3 min-[430px]:flex-row flex-col">
              <p className="text-sm">Reason for cancellation:</p>
              <select
                className="rounded-md p-1 outline-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              >
                <option value={undefined}>Please specify</option>
                <option value="customer_service">Customer Service</option>
                <option value="low_quality">Low Quality</option>
                <option value="missing_features">Missing Features</option>
                <option value="switched_service">Switched Service</option>
                <option value="too_complex">Too Complex</option>
                <option value="too_expensive">Too Expensive</option>
                <option value="unused">Unused</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div>
              <p className="text-sm mb-2">
                More information (the more details, the more helpful it&apos;d
                be)
              </p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. I needed a feature that..."
                className="resize-none w-full rounded-md p-2 border-neutral-content bg-base-100 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100"
              />
            </div>
          </fieldset>
        ) : undefined}

        <button
          className={`mx-auto text-white flex items-center gap-2 py-1 px-3 rounded-md text-lg tracking-wide select-none font-semibold duration-100 w-fit ${
            submitLoader
              ? "bg-red-400 cursor-auto"
              : "bg-red-500 hover:bg-red-400 cursor-pointer"
          }`}
          onClick={() => {
            if (!submitLoader) {
              submit();
            }
          }}
        >
          <p className="text-center w-full">Delete Your Account</p>
        </button>
      </div>
    </CenteredForm>
  );
}
