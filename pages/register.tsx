import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import SubmitButton from "@/components/SubmitButton";

interface FormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export default function Register() {
  const router = useRouter();

  const [submitLoader, setSubmitLoader] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  async function registerUser() {
    if (
      form.name !== "" &&
      form.email !== "" &&
      form.password !== "" &&
      form.passwordConfirmation !== ""
    ) {
      if (form.password === form.passwordConfirmation) {
        const { passwordConfirmation, ...request } = form;

        setSubmitLoader(true);

        const load = toast.loading("Creating Account...");

        const response = await fetch("/api/auth/register", {
          body: JSON.stringify(request),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        const data = await response.json();

        toast.dismiss(load);

        setSubmitLoader(false);

        if (response.ok) {
          setForm({
            name: "",
            email: "",
            password: "",
            passwordConfirmation: "",
          });

          toast.success("User Created!");

          router.push("/login");
        } else {
          toast.error(data.response);
        }
      } else {
        toast.error("Passwords do not match.");
      }
    } else {
      toast.error("Please fill out all the fields.");
    }
  }

  return (
    <>
      <p className="text-xl font-bold text-center my-10 text-sky-500">
        Linkwarden
      </p>
      <div className="p-5 mx-auto flex flex-col gap-3 justify-between sm:w-[28rem] w-80 bg-slate-50 rounded-md border border-sky-100">
        <div className="my-5 text-center">
          <p className="text-3xl font-bold text-sky-500">Get started</p>
          <p className="text-md font-semibold text-sky-400">
            Create a new account
          </p>
        </div>

        <p className="text-sm text-sky-500 w-fit font-semibold">Display Name</p>

        <input
          type="text"
          placeholder="Johnny"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">Email</p>

        <input
          type="text"
          placeholder="johnny@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">Password</p>

        <input
          type="password"
          placeholder="*****************"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <p className="text-sm text-sky-500 w-fit font-semibold">
          Re-enter Password
        </p>

        <input
          type="password"
          placeholder="*****************"
          value={form.passwordConfirmation}
          onChange={(e) =>
            setForm({ ...form, passwordConfirmation: e.target.value })
          }
          className="w-full rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
        <SubmitButton
          onClick={registerUser}
          label="Sign Up"
          className="mt-2 w-full text-center"
          loading={submitLoader}
        />
      </div>
      <div className="flex items-baseline gap-1 justify-center mt-10">
        <p className="w-fit text-gray-500">Have an account?</p>
        <Link href={"/login"} className="block w-min text-sky-500 font-bold">
          Login
        </Link>
      </div>
    </>
  );
}
