import toast from "react-hot-toast";
import Modal from "../Modal";
import useUserStore from "@/store/admin/users";
import TextInput from "../TextInput";
import { FormEvent, useState } from "react";

type Props = {
  onClose: Function;
};

type FormData = {
  name: string;
  username?: string;
  email?: string;
  password: string;
};

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true";

export default function NewUserModal({ onClose }: Props) {
  const { addUser } = useUserStore();

  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    email: emailEnabled ? "" : undefined,
    password: "",
  });

  const [submitLoader, setSubmitLoader] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submitLoader) {
      const checkFields = () => {
        if (emailEnabled) {
          return form.name !== "" && form.email !== "" && form.password !== "";
        } else {
          return (
            form.name !== "" && form.username !== "" && form.password !== ""
          );
        }
      };

      if (checkFields()) {
        if (form.password.length < 8)
          return toast.error("Passwords must be at least 8 characters.");

        setSubmitLoader(true);

        const load = toast.loading("Creating Account...");

        const response = await addUser(form);

        toast.dismiss(load);
        setSubmitLoader(false);

        if (response.ok) {
          toast.success("User Created!");
          onClose();
        } else {
          toast.error(response.data as string);
        }
      } else {
        toast.error("Please fill out all the fields.");
      }
    }
  }

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Create New User</p>

      <div className="divider mb-3 mt-1"></div>

      <form onSubmit={submit}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">Display Name</p>
            <TextInput
              placeholder="Johnny"
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              value={form.name}
            />
          </div>

          {emailEnabled ? (
            <div>
              <p className="mb-2">Username</p>
              <TextInput
                placeholder="john"
                className="bg-base-200"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                value={form.username}
              />
            </div>
          ) : undefined}

          <div>
            <p className="mb-2">Email</p>
            <TextInput
              placeholder="johnny@example.com"
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              value={form.email}
            />
          </div>

          <div>
            <p className="mb-2">Password</p>
            <TextInput
              placeholder="••••••••••••••"
              className="bg-base-200"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              value={form.password}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <button
            className="btn btn-accent dark:border-violet-400 text-white ml-auto"
            type="submit"
          >
            Create User
          </button>
        </div>
      </form>
    </Modal>
  );
}
