import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import Modal from "../Modal";

type Props = {
  onClose: Function;
  onSubmit: Function;
  oldEmail: string;
  newEmail: string;
};

export default function EmailChangeVerificationModal({
  onClose,
  onSubmit,
  oldEmail,
  newEmail,
}: Props) {
  const [password, setPassword] = useState("");

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Confirm Password</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-5">
        <p>
          Please confirm your password before changing your email address.{" "}
          {process.env.NEXT_PUBLIC_STRIPE === "true" &&
            "Updating this field will change your billing email on Stripe as well."}
        </p>

        <p>
          If you change your email address, any existing{" "}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && "Google"} SSO
          connections will be removed.
        </p>

        <div>
          <p>Old Email</p>
          <p className="text-neutral">{oldEmail}</p>
        </div>

        <div>
          <p>New Email</p>
          <p className="text-neutral">{newEmail}</p>
        </div>

        <div className="w-full">
          <p className="mb-2">Password</p>
          <TextInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••"
            className="bg-base-200"
            type="password"
            autoFocus
          />
        </div>

        <div className="flex justify-end items-center">
          <button
            className="btn btn-accent dark:border-violet-400 text-white"
            onClick={() => onSubmit(password)}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
