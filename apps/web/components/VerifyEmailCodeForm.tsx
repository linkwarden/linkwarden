import { Button } from "@/components/ui/button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/components/CenteredForm";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";

type Props = {
  email: string;
  // Signs in with the password the user just entered plus this code
  onVerify: (code: string) => Promise<void>;
};

export default function VerifyEmailCodeForm({ email, onVerify }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submitLoader, setSubmitLoader] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLoader) return;
    else if (code.length !== 6)
      return toast.error(t("enter_verification_code"));

    setSubmitLoader(true);

    const load = toast.loading(t("verifying"));

    await onVerify(code);

    toast.dismiss(load);

    setSubmitLoader(false);
  }

  async function resend() {
    if (submitLoader) return;

    setSubmitLoader(true);

    try {
      const response = await fetch("/api/v1/auth/request-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // A proxy in front of the server can answer with an HTML error page
      const data = await response.json().catch(() => null);

      if (response.ok) toast.success(t("verification_code_sent"));
      else toast.error(data?.response || t("verification_code_not_sent"));
    } catch {
      toast.error(t("verification_code_not_sent"));
    } finally {
      setSubmitLoader(false);
    }
  }

  return (
    <CenteredForm header={t("verify_your_email")}>
      <form onSubmit={verify}>
        <div className="mx-auto flex flex-col gap-3 justify-between max-w-md min-w-80 w-full">
          <p>{t("verification_code_sent_desc")}</p>

          {/* Shown only when the user logged in with their email, not a username */}
          {email.includes("@") && (
            <p className="text-center tracking-widest break-all">{email}</p>
          )}

          <TextInput
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("verification_code")}
            value={code}
            className="bg-base-100 text-center tracking-widest"
            data-testid="verification-code-input"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          <Button
            type="submit"
            size="full"
            variant="accent"
            data-testid="verify-email-button"
            disabled={submitLoader}
          >
            {t("verify")}
          </Button>

          <div className="mx-auto w-fit">
            <Button
              type="button"
              onClick={resend}
              variant="ghost"
              size="sm"
              disabled={submitLoader}
            >
              {t("resend_code")}
            </Button>
          </div>
        </div>
      </form>
    </CenteredForm>
  );
}
