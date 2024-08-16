import CenteredForm from "@/layouts/CenteredForm";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function EmailConfirmaion() {
  const router = useRouter();

  const { t } = useTranslation();

  const [submitLoader, setSubmitLoader] = useState(false);

  const resend = async () => {
    if (submitLoader) return;
    else if (!router.query.email) return;

    setSubmitLoader(true);

    const load = toast.loading(t("authenticating"));

    const res = await signIn("email", {
      email: decodeURIComponent(router.query.email as string),
      callbackUrl: "/",
      redirect: false,
    });

    toast.dismiss(load);

    setSubmitLoader(false);

    toast.success(t("verification_email_sent"));
  };

  return (
    <CenteredForm>
      <div className="p-4 max-w-[30rem] min-w-80 w-full rounded-2xl shadow-md mx-auto border border-neutral-content bg-base-200">
        <p className="text-center text-2xl sm:text-3xl font-extralight mb-2 ">
          {t("check_your_email")}
        </p>

        <div className="divider my-3"></div>

        {router.query.email && typeof router.query.email === "string" && (
          <p className="text-center font-bold mb-3 break-all">
            {decodeURIComponent(router.query.email)}
          </p>
        )}

        <p>{t("verification_email_sent_desc")}</p>

        <div className="mx-auto w-fit mt-3">
          <div className="btn btn-ghost btn-sm" onClick={resend}>
            {t("resend_email")}
          </div>
        </div>
      </div>
    </CenteredForm>
  );
}

export { getServerSideProps };
