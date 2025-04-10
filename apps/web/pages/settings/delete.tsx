import React, { useState } from "react";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useUser } from "@/hooks/store/user";

export default function Delete() {
  const [password, setPassword] = useState("");
  const [comment, setComment] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [submitLoader, setSubmitLoader] = useState(false);
  const { data } = useSession();
  const { t } = useTranslation();
  const { data: user } = useUser();

  const submit = async () => {
    const body = {
      password,
      cancellation_details: {
        comment,
        feedback,
      },
    };

    if (password === "") {
      return toast.error(t("fill_required_fields"));
    }

    setSubmitLoader(true);
    const load = toast.loading(t("deleting_message"));

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
    } else {
      toast.error(message);
    }

    setSubmitLoader(false);
  };

  return (
    <CenteredForm>
      <div className="p-4 mx-auto relative flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 bg-base-200 rounded-2xl shadow-md border border-neutral-content">
        <Link
          href="/settings/account"
          className="absolute top-4 left-4 btn btn-ghost btn-square btn-sm"
        >
          <i className="bi-chevron-left text-neutral text-xl"></i>
        </Link>
        <div className="flex items-center gap-2 w-full rounded-md h-8">
          <p className="text-red-500 dark:text-red-500 truncate w-full text-3xl text-center">
            {t("delete_account")}
          </p>
        </div>

        <div className="divider my-0"></div>

        <p>{t("delete_warning")}</p>

        <div>
          <p className="mb-2">{t("confirm_password")}</p>
          <TextInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••"
            className="bg-base-100"
            type="password"
          />
        </div>

        {process.env.NEXT_PUBLIC_STRIPE && !user.parentSubscriptionId && (
          <fieldset className="border rounded-md p-2 border-primary">
            <legend className="px-3 py-1 text-sm sm:text-base border rounded-md border-primary">
              <b>{t("optional")}</b> <i>{t("feedback_help")}</i>
            </legend>
            <label className="w-full flex min-[430px]:items-center items-start gap-2 mb-3 min-[430px]:flex-row flex-col">
              <p className="text-sm">{t("reason_for_cancellation")}:</p>
              <select
                className="rounded-md p-1 outline-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              >
                <option value={undefined}>{t("please_specify")}</option>
                <option value="customer_service">
                  {t("customer_service")}
                </option>
                <option value="low_quality">{t("low_quality")}</option>
                <option value="missing_features">
                  {t("missing_features")}
                </option>
                <option value="switched_service">
                  {t("switched_service")}
                </option>
                <option value="too_complex">{t("too_complex")}</option>
                <option value="too_expensive">{t("too_expensive")}</option>
                <option value="unused">{t("unused")}</option>
                <option value="other">{t("other")}</option>
              </select>
            </label>
            <div>
              <p className="text-sm mb-2">{t("more_information")}</p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("feedback_placeholder")}
                className="resize-none w-full rounded-md p-2 border-neutral-content bg-base-100 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100"
              />
            </div>
          </fieldset>
        )}

        <Button
          className="mx-auto"
          intent="destructive"
          loading={submitLoader}
          onClick={submit}
        >
          <p className="text-center w-full">{t("delete_your_account")}</p>
        </Button>
      </div>
    </CenteredForm>
  );
}

export { getServerSideProps };
