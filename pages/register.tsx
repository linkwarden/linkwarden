// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function () {
  const router = useRouter();

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

        router.push("/login");
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
        className="border border-gray-700 rounded-md block m-2 mx-auto p-2"
      />
      <input
        type="text"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-gray-700 rounded-md block m-2 mx-auto p-2"
      />
      <input
        type="text"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border border-gray-700 rounded-md block m-2 mx-auto p-2"
      />
      <div
        className="mx-auto bg-black w-min p-3 m-5 text-white rounded-md cursor-pointer"
        onClick={registerUser}
      >
        Register
      </div>
      <Link href={"/login"} className="block mx-auto w-min">
        Login
      </Link>
    </div>
  );
}
