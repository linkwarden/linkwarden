import toast from "react-hot-toast";
import Modal from "../Modal";
import TextInput from "../TextInput";
import { FormEvent, useState } from "react";
import { useTranslation, Trans } from "next-i18next";
import { useAddUser } from "@/hooks/store/admin/users";
import Link from "next/link";
import { signIn } from "next-auth/react";

type Props = {
  onClose: Function;
};

type FormData = {
  username?: string;
  email?: string;
  invite: boolean;
};

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true";

export default function InviteModal({ onClose }: Props) {
  const { t } = useTranslation();

  const addUser = useAddUser();

  const [form, setForm] = useState<FormData>({
    username: emailEnabled ? undefined : "",
    email: emailEnabled ? "" : undefined,
    invite: true,
  });
  const [submitLoader, setSubmitLoader] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
      const checkFields = () => {
        if (emailEnabled) {
          return form.email !== "";
        } else {
          return form.username !== "";
        }
      };

      if (checkFields()) {
        setSubmitLoader(true);

        await addUser.mutateAsync(form, {
          onSettled: () => {
            setSubmitLoader(false);
          },
          onSuccess: async () => {
            await signIn("invite", {
              email: form.email,
              callbackUrl: "/member-onboarding",
              redirect: false,
            });
            onClose();
          },
        });
      } else {
        toast.error(t("fill_all_fields_error"));
      }
    }
  }

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("invite_user")}</p>
      <div className="divider mb-3 mt-1"></div>
      <p className="mb-3">{t("invite_user_desc")}</p>
      <form onSubmit={submit}>
        {emailEnabled ? (
          <div>
            <TextInput
              placeholder={t("placeholder_email")}
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              value={form.email}
            />
          </div>
        ) : (
          <div>
            <p className="mb-2">
              {t("username")}{" "}
              {emailEnabled && (
                <span className="text-xs text-neutral">{t("optional")}</span>
              )}
            </p>
            <TextInput
              placeholder={t("placeholder_john")}
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              value={form.username}
            />
          </div>
        )}

        <div role="note" className="alert alert-note mt-5">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <p>{t("invite_user_note")}</p>
            <p className="mb-1">
              {t("invite_user_price", {
                price: 4,
                priceAnnual: 36,
              })}
            </p>
            <Link
              href="https://docs.linkwarden.app/billing/seats#how-seats-affect-billing"
              className="font-semibold whitespace-nowrap hover:opacity-80 duration-100"
              target="_blank"
            >
              {t("learn_more")} <i className="bi-box-arrow-up-right"></i>
            </Link>
          </span>
        </div>

        <div className="flex justify-between items-center mt-5">
          <button
            className="btn btn-accent dark:border-violet-400 text-white ml-auto"
            type="submit"
          >
            {t("send_invitation")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
