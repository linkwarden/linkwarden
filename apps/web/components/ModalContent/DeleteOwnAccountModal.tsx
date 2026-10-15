import { useState } from "react";
import { toast } from "react-hot-toast";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";
import Modal from "../Modal";
import TextInput from "@/components/TextInput";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";

type Props = {
  onClose: Function;
};

export default function DeleteOwnAccountModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { data } = useSession();
  const { data: user } = useUser();

  const [password, setPassword] = useState("");
  const [comment, setComment] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [confirmation, setConfirmation] = useState("");
  const [submitLoader, setSubmitLoader] = useState(false);

  const canDelete = user?.hasPassword
    ? password !== ""
    : confirmation.trim() === "confirm";

  const submit = async () => {
    if (!canDelete || submitLoader) return;

    setSubmitLoader(true);
    const load = toast.loading(t("deleting_message"));

    const response = await fetch(`/api/v1/users/${data?.user.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
        cancellation_details: {
          comment,
          feedback,
        },
      }),
    });

    const message = (await response.json()).response;

    toast.dismiss(load);

    if (response.ok) {
      signOut({ callbackUrl: "/login?nosso=1" });
    } else {
      toast.error(message);
      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">{t("delete_account")}</p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        <p>{t("delete_warning")}</p>

        {user?.subscription?.active &&
          user.subscription.provider === "APPLE" && (
            <p>
              {t("delete_account_apple_subscription_notice")}{" "}
              <a
                className="underline text-primary"
                href="https://apps.apple.com/account/subscriptions"
                target="_blank"
                rel="noreferrer"
              >
                https://apps.apple.com/account/subscriptions
              </a>
            </p>
          )}

        {user?.subscription?.active &&
          user.subscription.provider === "GOOGLE" && (
            <p>{t("delete_account_google_subscription_notice")}</p>
          )}

        {user?.hasPassword ? (
          <div>
            <p className="mb-2 font-semibold">{t("confirm_password")}</p>
            <TextInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              className="bg-base-100"
              type="password"
            />
          </div>
        ) : (
          <div>
            <p className="mb-2 font-semibold">{t("type_confirm_to_delete")}</p>
            <TextInput
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="confirm"
              className="bg-base-100"
              autoComplete="off"
            />
          </div>
        )}

        <fieldset className="border rounded-md p-2 border-primary">
          <legend className="px-3 py-1 text-sm sm:text-base border rounded-md border-primary">
            <b>{t("optional")}</b> <i>{t("feedback_help")}</i>
          </legend>
          <label className="w-full flex min-[430px]:items-center items-start gap-2 mb-3 min-[430px]:flex-row flex-col">
            <p className="text-sm">{t("reason_for_cancellation")}:</p>
            <select
              className="rounded-md p-1 outline-none bg-base-100"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            >
              <option value={undefined}>{t("please_specify")}</option>
              <option value="customer_service">{t("customer_service")}</option>
              <option value="low_quality">{t("low_quality")}</option>
              <option value="missing_features">{t("missing_features")}</option>
              <option value="switched_service">{t("switched_service")}</option>
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

        <Button
          className="ml-auto"
          variant="destructive"
          disabled={!canDelete || submitLoader}
          onClick={submit}
        >
          <i className="bi-trash text-xl" />
          {t("delete_your_account")}
        </Button>
      </div>
    </Modal>
  );
}
