import { useState } from "react";

interface FormData {
  name: string;
  username: string;
  password: string;
}

export default function Register() {
  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    password: "",
  });

  function registerUser() {
    console.log(form);
    if (form.name != "" && form.username != "" && form.password != "") {
      fetch("/api/register", {
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      setForm({
        name: "",
        username: "",
        password: "",
      });
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
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
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
        className="mx-auto bg-gray-700 w-min p-3 m-5 text-white rounded cursor-pointer"
        onClick={registerUser}
      >
        Register
      </div>
    </div>
  );
}
