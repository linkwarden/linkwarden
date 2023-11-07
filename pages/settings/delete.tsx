import { useState } from "react";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

export default function Password() {
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

    if (password == "") {
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
      <div className="p-4 mx-auto relative flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 rounded-2xl shadow-md border border-sky-100">
        <Link
          href="/settings/account"
          className="absolute top-4 left-4 gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 w-full rounded-md h-8">
          <p className="text-red-500 dark:text-red-500 truncate w-full text-3xl text-center">
            Delete Account
          </p>
        </div>

        <hr className="border-1 border-sky-100 dark:border-neutral-700" />

        <p>
          This will permanently delete all the Links, Collections, Tags, and
          archived data you own. It will also log you out
          {process.env.NEXT_PUBLIC_STRIPE
            ? " and cancel your subscription"
            : undefined}
          . This action is irreversible!
        </p>

        <div>
          <p className="mb-2 text-black dark:text-white">
            Confirm Your Password
          </p>

          <TextInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••"
            type="password"
          />
        </div>

        {process.env.NEXT_PUBLIC_STRIPE ? (
          <fieldset className="border rounded-md p-2 border-sky-500">
            <legend className="px-3 py-1 text-sm sm:text-base border rounded-md border-sky-500">
              <b>Optional</b>{" "}
              <i className="min-[390px]:text-sm text-xs">
                (but it really helps us improve!)
              </i>
            </legend>
            <label className="w-full flex min-[430px]:items-center items-start gap-2 mb-3 min-[430px]:flex-row flex-col">
              <p className="text-sm">Reason for cancellation:</p>
              <select
                className="rounded-md p-1 border-sky-100 bg-gray-50 dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100 dark:bg-neutral-950"
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
              <p className="text-sm mb-2 text-black dark:text-white">
                More information (the more details, the more helpful it&apos;d
                be)
              </p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. I needed a feature that..."
                className="resize-none w-full rounded-md p-2 border-sky-100 bg-gray-50 dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100 dark:bg-neutral-950"
              />
            </div>
          </fieldset>
        ) : undefined}

        <button
          className={`mx-auto lg:mx-0 text-white flex items-center gap-2 py-1 px-3 rounded-md text-lg tracking-wide select-none font-semibold duration-100 w-fit ${
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
