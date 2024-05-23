import AccentSubmitButton from "@/components/ui/Button";
import TextInput from "@/components/TextInput";
import CenteredForm from "@/layouts/CenteredForm";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
}

export default function Forgot() {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    email: "",
  });

  const [isEmailSent, setIsEmailSent] = useState(false);

  async function submitRequest() {
    const response = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success(data.response);
      setIsEmailSent(true);
    } else {
      toast.error(data.response);
    }
  }

  async function sendConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.email !== "") {
      setSubmitLoader(true);

      const load = toast.loading("Sending password recovery link...");

      await submitRequest();

      toast.dismiss(load);

      setSubmitLoader(false);
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <CenteredForm>
      <form onSubmit={sendConfirmation}>
        <div className="p-4 mx-auto flex flex-col gap-3 justify-between max-w-[30rem] min-w-80 w-full bg-base-200 rounded-2xl shadow-md border border-neutral-content">
          <p className="text-3xl text-center font-extralight">
            {isEmailSent ? "Email Sent!" : "Forgot Password?"}
          </p>

          <div className="divider my-0"></div>

          {!isEmailSent ? (
            <>
              <div>
                <p>
                  Enter your email so we can send you a link to create a new
                  password.
                </p>
              </div>
              <div>
                <p className="text-sm w-fit font-semibold mb-1">Email</p>

                <TextInput
                  autoFocus
                  type="email"
                  placeholder="johnny@example.com"
                  value={form.email}
                  className="bg-base-100"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <AccentSubmitButton
                type="submit"
                intent="accent"
                className="mt-2"
                size="full"
                loading={submitLoader}
              >
                Send Login Link
              </AccentSubmitButton>
            </>
          ) : (
            <p>
              Check your email for a link to reset your password. If it doesn’t
              appear within a few minutes, check your spam folder.
            </p>
          )}

          <div className="mx-auto w-fit mt-2">
            <Link className="font-semibold" href="/login">
              Back to Login
            </Link>
          </div>
        </div>
      </form>
    </CenteredForm>
  );
}
