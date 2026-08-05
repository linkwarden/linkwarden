import { Button } from "@/components/ui/button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/components/CenteredForm";
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
    <CenteredForm
      header={requestSent ? t("password_updated") : t("reset_password")}
    >
      <form onSubmit={submit}>
        <div className="mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full">
          {!requestSent ? (
            <>
              <p className="text-center">{t("enter_email_for_new_password")}</p>
              <div>
                <TextInput
                  autoFocus
                  type="password"
                  placeholder={t("new_password")}
                  value={form.password}
                  className="bg-base-100"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                size="full"
                disabled={submitLoader}
              >
                {t("update_password")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-center">
                {t("password_successfully_updated")}
              </p>
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
