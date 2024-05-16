import { useRouter } from "next/router";
import { useEffect } from "react";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const router = useRouter();

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
        toast.success("Email verified. You can now login.");
      } else {
        toast.error("Invalid token.");
      }
    });

    console.log(token);
  }, []);

  return <div>Verify email...</div>;
};

export default VerifyEmail;
