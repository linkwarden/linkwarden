import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function Register() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "authenticated") {
      console.log("Already logged in.");
      router.push("/");
    }
  }, [session]);

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });

  async function registerUser() {
    let success: boolean = false;
    console.log(form);

    if (form.name != "" && form.email != "" && form.password != "") {
      await fetch("/api/auth/register", {
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((res) => {
          success = res.ok;
          return res.json();
        })
        .then((data) => console.log(data));

      if (success) {
        setForm({
          name: "",
          email: "",
          password: "",
        });

        router.push("/auth/login");
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
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border border-gray-700 rounded block m-2 mx-auto p-2"
      />
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
        onClick={registerUser}
      >
        Register
      </div>
      <Link href={"/auth/login"} className="block mx-auto w-min">
        Login
      </Link>
    </div>
  );
}
