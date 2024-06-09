import Button from "@/components/ui/Button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";

interface FormData {
  password: string;
  token: string;
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const [submitLoader, setSubmitLoader] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    password: "",
    token: router.query.token as string,
  });

  const [requestSent, setRequestSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      form.password !== "" &&
      form.token !== "" &&
      !requestSent &&
      !submitLoader
    ) {
      setSubmitLoader(true);

      const load = toast.loading(t("sending_password_recovery_link"));

      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      toast.dismiss(load);
      if (response.ok) {
        toast.success(data.response);
        setRequestSent(true);
      } else {
        toast.error(data.response);
      }

      setSubmitLoader(false);
    } else {
      toast.error(t("please_fill_all_fields"));
    }
  }

  return (
    <CenteredForm>
      <form onSubmit={submit}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p className="text-3xl text-center font-extralight">
            {requestSent ? t("password_updated") : t("reset_password")}
          </p>

          <div className="divider my-0"></div>

          {!requestSent ? (
            <>
              <p>{t("enter_email_for_new_password")}</p>
              <div>
                <p className="text-sm w-fit font-semibold mb-1">
                  {t("new_password")}
                </p>
                <TextInput
                  autoFocus
                  type="password"
                  placeholder="••••••••••••••"
                  value={form.password}
                  className="bg-base-100"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                intent="accent"
                className="mt-2"
                size="full"
                loading={submitLoader}
              >
                {t("update_password")}
              </Button>
            </>
          ) : (
            <>
              <p>{t("password_successfully_updated")}</p>
              <div className="mx-auto w-fit mt-3">
                <Link className="font-semibold" href="/login">
                  {t("back_to_login")}
                </Link>
              </div>
            </>
          )}
        </div>
      </form>
    </CenteredForm>
  );
}

export { getServerSideProps };
