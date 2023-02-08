import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });

  async function loginUser() {
    console.log(form);
    if (form.email != "" && form.password != "") {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.ok) {
        setForm({
          email: "",
          password: "",
        });

        // router.push("/");
      } else {
        console.log("User not found or password does not match.", res);
      }
    } else {
      console.log("Please fill out all the fields.");
    }
  }

  return (
    <div className="p-5">
      <p className="text-3xl font-bold text-center mb-10">Linkwarden</p>
      <input
        type="text"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-gray-700 rounded block m-2 mx-auto p-2"
      />
      <input
        type="text"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border border-gray-700 rounded block m-2 mx-auto p-2"
      />
      <div
        className="mx-auto bg-black w-min p-3 m-5 text-white rounded cursor-pointer"
        onClick={loginUser}
      >
        Login
      </div>
      <Link href={"/register"} className="block mx-auto w-min">
        Register
      </Link>
    </div>
  );
}
