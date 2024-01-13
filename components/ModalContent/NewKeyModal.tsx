import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import { KeyExpiry } from "@/types/global";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Modal from "../Modal";

type Props = {
  onClose: Function;
};

export default function NewKeyModal({ onClose }: Props) {
  const { data } = useSession();

  const initial = {
    name: "",
    expires: 0 as KeyExpiry,
  };

  const [key, setKey] = useState(initial as any);

  const [submitLoader, setSubmitLoader] = useState(false);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      let response;

      const load = toast.loading("Creating...");

      response = await fetch("/api/v1/tokens", {
        method: "POST",
        body: JSON.stringify({
          name: key.name,
          expires: key.expires,
        }),
      });

      const data = await response.json();

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Created!`);
        onClose();
      } else toast.error(data.response as string);

      setSubmitLoader(false);

      return response;
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Create an Access Token</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex gap-2 items-center">
        <div className="w-full">
          <p className="mb-2">Name</p>

          <TextInput
            value={key.name}
            onChange={(e) => setKey({ ...key, name: e.target.value })}
            placeholder="e.g. For the Mobile App"
            className="bg-base-200"
          />
        </div>

        <div>
          <p className="mb-2">Date of Expiry</p>

          <div className="dropdown dropdown-bottom dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-outline w-36 flex items-center btn-sm h-10"
            >
              {key.expires === KeyExpiry.sevenDays && "7 Days"}
              {key.expires === KeyExpiry.oneMonth && "30 Days"}
              {key.expires === KeyExpiry.twoMonths && "60 Days"}
              {key.expires === KeyExpiry.threeMonths && "90 Days"}
              {key.expires === KeyExpiry.never && "No Expiration"}
            </div>
            <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-xl w-52 mt-1">
              <li>
                <label
                  className="label cursor-pointer flex justify-start"
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="radio"
                    name="sort-radio"
                    className="radio checked:bg-primary"
                    checked={key.expires === KeyExpiry.sevenDays}
                    onChange={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setKey({ ...key, expires: KeyExpiry.sevenDays });
                    }}
                  />
                  <span className="label-text">7 Days</span>
                </label>
              </li>
              <li>
                <label
                  className="label cursor-pointer flex justify-start"
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="radio"
                    name="sort-radio"
                    className="radio checked:bg-primary"
                    checked={key.expires === KeyExpiry.oneMonth}
                    onChange={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setKey({ ...key, expires: KeyExpiry.oneMonth });
                    }}
                  />
                  <span className="label-text">30 Days</span>
                </label>
              </li>
              <li>
                <label
                  className="label cursor-pointer flex justify-start"
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="radio"
                    name="sort-radio"
                    className="radio checked:bg-primary"
                    checked={key.expires === KeyExpiry.twoMonths}
                    onChange={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setKey({ ...key, expires: KeyExpiry.twoMonths });
                    }}
                  />
                  <span className="label-text">60 Days</span>
                </label>
              </li>
              <li>
                <label
                  className="label cursor-pointer flex justify-start"
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="radio"
                    name="sort-radio"
                    className="radio checked:bg-primary"
                    checked={key.expires === KeyExpiry.threeMonths}
                    onChange={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setKey({ ...key, expires: KeyExpiry.threeMonths });
                    }}
                  />
                  <span className="label-text">90 Days</span>
                </label>
              </li>
              <li>
                <label
                  className="label cursor-pointer flex justify-start"
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="radio"
                    name="sort-radio"
                    className="radio checked:bg-primary"
                    checked={key.expires === KeyExpiry.never}
                    onChange={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setKey({ ...key, expires: KeyExpiry.never });
                    }}
                  />
                  <span className="label-text">No Expiration</span>
                </label>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-5">
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
        >
          Create Access Token
        </button>
      </div>
    </Modal>
  );
}
