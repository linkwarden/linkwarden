import { Button } from "@/components/ui/button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/components/CenteredForm";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { useUpdateUser, useUser } from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";

interface FormData {
  password: string;
  name: string;
}

export default function MemberOnboarding() {
  const { t } = useTranslation();
  const [submitLoader, setSubmitLoader] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    password: "",
    name: "",
  });

  const { data: user } = useUser();
  const { data: config } = useConfig();
  const updateUser = useUpdateUser();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.password !== "" && form.name !== "" && !submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading(t("sending_password_recovery_link"));

      await updateUser.mutateAsync(
        {
          ...user,
          name: form.name,
          password: form.password,
        },
        {
          onSuccess: (data) => {
            router.push("/dashboard");
          },
          onSettled: (data, error) => {
            setSubmitLoader(false);
            toast.dismiss(load);

            if (error) {
              toast.error(error.message);
            } else {
              toast.success(t("settings_applied"));
            }
          },
        }
      );
    } else {
      toast.error(t("please_fill_all_fields"));
    }
  }

  return (
    <CenteredForm header={t("invitation_accepted")}>
      <form onSubmit={submit}>
        <div className="mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full">
          <p
            style={{
              whiteSpace: "pre-line",
            }}
          >
            {t("invitation_desc", {
              owner: user?.parentSubscription?.user?.email,
            })}
          </p>

          <div>
            <TextInput
              autoFocus
              placeholder={t("display_name")}
              value={form.name}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <TextInput
              type="password"
              placeholder={t("new_password")}
              value={form.password}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {config?.STRIPE_ENABLED && (
            <div className="text-xs text-neutral text-center">
              <p>
                By continuing, you agree to our{" "}
                <Link
                  href="https://linkwarden.app/tos"
                  className="underline"
                  data-testid="terms-of-service-link"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="https://linkwarden.app/privacy-policy"
                  className="underline"
                  data-testid="privacy-policy-link"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            size="full"
            disabled={submitLoader}
          >
            {t("continue_to_dashboard")}
          </Button>
        </div>
      </form>
    </CenteredForm>
  );
}

export { getServerSideProps };
