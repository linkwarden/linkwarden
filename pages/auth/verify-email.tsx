import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";

const VerifyEmail = () => {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const token = router.query.token;

    if (!token || typeof token !== "string") {
      router.push("/login");
    }

    // Verify token

    fetch(`/api/v1/auth/verify-email?token=${token}`, {
      method: "POST",
    }).then((res) => {
      if (res.ok) {
        toast.success(t("email_verified_signing_out"));
        setTimeout(() => {
          signOut();
        }, 3000);
      } else {
        toast.error(t("invalid_token"));
      }
    });

    console.log(token);
  }, []);

  return <></>;
};

export default VerifyEmail;

export { getServerSideProps };
