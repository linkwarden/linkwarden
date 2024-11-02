import toast from "react-hot-toast";
import Modal from "../Modal";
import TextInput from "../TextInput";
import { FormEvent, useState } from "react";
import { useTranslation, Trans } from "next-i18next";
import { useAddUser } from "@/hooks/store/admin/users";

type Props = {
  onClose: Function;
};

type FormData = {
  name: string;
  username?: string;
  email?: string;
  password: string;
};

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true";

export default function NewUserModal({ onClose }: Props) {
  const { t } = useTranslation();

  const addUser = useAddUser();

  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    email: emailEnabled ? "" : undefined,
    password: "",
  });
  const [submitLoader, setSubmitLoader] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
      if (form.password.length < 8)
        return toast.error(t("password_length_error"));

      const checkFields = () => {
        if (emailEnabled) {
          return form.name !== "" && form.email !== "" && form.password !== "";
        } else {
          return (
            form.name !== "" && form.username !== "" && form.password !== ""
          );
        }
      };

      if (checkFields()) {
        setSubmitLoader(true);

        await addUser.mutateAsync(form, {
          onSuccess: () => {
            onClose();
          },
          onSettled: () => {
            setSubmitLoader(false);
          },
        });
      } else {
        toast.error(t("fill_all_fields_error"));
      }
    }
  }

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("create_new_user")}</p>

      <div className="divider mb-3 mt-1"></div>

      <form onSubmit={submit}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">{t("display_name")}</p>
            <TextInput
              placeholder={t("placeholder_johnny")}
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              value={form.name}
            />
          </div>

          {emailEnabled && (
            <div>
              <p className="mb-2">{t("email")}</p>
              <TextInput
                placeholder={t("placeholder_email")}
                className="bg-base-200"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                value={form.email}
              />
            </div>
          )}

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

          <div>
            <p className="mb-2">{t("password")}</p>
            <TextInput
              placeholder="••••••••••••••"
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              value={form.password}
            />
          </div>
        </div>

        <div role="note" className="alert alert-note mt-5">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <Trans
              i18nKey="password_change_note"
              components={[<b key={0} />]}
            />
          </span>
        </div>

        <div className="flex justify-between items-center mt-5">
          <button
            className="btn btn-accent dark:border-violet-400 text-white ml-auto"
            type="submit"
          >
            {t("create_user")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
