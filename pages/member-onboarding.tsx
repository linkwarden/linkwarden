import Button from "@/components/ui/Button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { Trans, useTranslation } from "next-i18next";
import { useUpdateUser, useUser } from "@/hooks/store/user";

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

  const { data: user = {} } = useUser();
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
    <CenteredForm>
      <form onSubmit={submit}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p className="text-3xl text-center font-extralight">
            {t("invitation_accepted")}
          </p>

          <div className="divider my-0"></div>

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
            <p className="text-sm w-fit font-semibold mb-1">
              {t("display_name")}
            </p>
            <TextInput
              autoFocus
              placeholder="John Doe"
              value={form.name}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <p className="text-sm w-fit font-semibold mb-1">
              {t("new_password")}
            </p>
            <TextInput
              type="password"
              placeholder="••••••••••••••"
              value={form.password}
              className="bg-base-100"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {process.env.NEXT_PUBLIC_STRIPE && (
            <div className="text-xs text-neutral mb-3">
              <p>
                <Trans
                  i18nKey="sign_up_agreement"
                  components={[
                    <Link
                      href="https://linkwarden.app/tos"
                      className="font-semibold"
                      data-testid="terms-of-service-link"
                      key={0}
                    />,
                    <Link
                      href="https://linkwarden.app/privacy-policy"
                      className="font-semibold"
                      data-testid="privacy-policy-link"
                      key={1}
                    />,
                  ]}
                />
              </p>
            </div>
          )}

          <Button
            type="submit"
            intent="accent"
            className="mt-2"
            size="full"
            loading={submitLoader}
          >
            {t("continue_to_dashboard")}
          </Button>
        </div>
      </form>
    </CenteredForm>
  );
}

export { getServerSideProps };
