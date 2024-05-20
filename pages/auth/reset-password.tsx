import AccentSubmitButton from "@/components/AccentSubmitButton";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  password: string;
  token: string;
}

export default function ResetPassword() {
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

      const load = toast.loading("Sending password recovery link...");

      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.response);
        setRequestSent(true);
      } else {
        toast.error(data.response);
      }

      toast.dismiss(load);

      setSubmitLoader(false);
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <CenteredForm>
      <form onSubmit={submit}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p className="text-3xl text-center font-extralight">
            {requestSent ? "Password Updated!" : "Reset Password"}
          </p>

          <div className="divider my-0"></div>

          {!requestSent ? (
            <>
              <div>
                <p>
                  Enter your email so we can send you a link to create a new
                  password.
                </p>
              </div>
              <div>
                <p className="text-sm w-fit font-semibold mb-1">New Password</p>

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

              <AccentSubmitButton
                type="submit"
                label="Update Password"
                className="mt-2 w-full"
                loading={submitLoader}
              />
            </>
          ) : (
            <>
              <p>Your password has been successfully updated.</p>

              <div className="mx-auto w-fit mt-3">
                <Link className="font-semibold" href="/login">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </form>
    </CenteredForm>
  );
}
