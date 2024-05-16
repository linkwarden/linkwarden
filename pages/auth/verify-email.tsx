import { signOut } from "next-auth/react";
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
        toast.success("Email verified. Signing out..");
        setTimeout(() => {
          signOut();
        }, 3000);
      } else {
        toast.error("Invalid token.");
      }
    });

    console.log(token);
  }, []);

  return <></>;
};

export default VerifyEmail;
