import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import { TokenExpiry } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";
import useTokenStore from "@/store/tokens";
import { dropdownTriggerer } from "@/lib/client/utils";

type Props = {
  onClose: Function;
};

export default function NewTokenModal({ onClose }: Props) {
  const [newToken, setNewToken] = useState("");

  const { addToken } = useTokenStore();

  const initial = {
    name: "",
    expires: 0 as TokenExpiry,
  };

  const [token, setToken] = useState(initial as any);

  const [submitLoader, setSubmitLoader] = useState(false);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading("Creating...");

      const { ok, data } = await addToken(token);

      toast.dismiss(load);

      if (ok) {
        toast.success(`Created!`);
        setNewToken((data as any).secretKey);
      } else toast.error(data as string);

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      {newToken ? (
        <div className="flex flex-col justify-center space-y-4">
          <p className="text-xl font-thin">Access Token Created</p>
          <p>
            Your new token has been created. Please copy it and store it
            somewhere safe. You will not be able to see it again.
          </p>
          <TextInput
            spellCheck={false}
            value={newToken}
            onChange={() => {}}
            className="w-full"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(newToken);
              toast.success("Copied to clipboard!");
            }}
            className="btn btn-primary w-fit mx-auto"
          >
            Copy to Clipboard
          </button>
        </div>
      ) : (
        <>
          <p className="text-xl font-thin">Create an Access Token</p>

          <div className="divider mb-3 mt-1"></div>

          <div className="flex sm:flex-row flex-col gap-2 items-center">
            <div className="w-full">
              <p className="mb-2">Name</p>

              <TextInput
                value={token.name}
                onChange={(e) => setToken({ ...token, name: e.target.value })}
                placeholder="e.g. For the iOS shortcut"
                className="bg-base-200"
              />
            </div>

            <div className="w-full sm:w-fit">
              <p className="mb-2">Expires in</p>

              <div className="dropdown dropdown-bottom dropdown-end w-full">
                <div
                  tabIndex={0}
                  role="button"
                  onMouseDown={dropdownTriggerer}
                  className="btn btn-outline w-full sm:w-36 flex items-center btn-sm h-10"
                >
                  {token.expires === TokenExpiry.sevenDays && "7 Days"}
                  {token.expires === TokenExpiry.oneMonth && "30 Days"}
                  {token.expires === TokenExpiry.twoMonths && "60 Days"}
                  {token.expires === TokenExpiry.threeMonths && "90 Days"}
                  {token.expires === TokenExpiry.never && "No Expiration"}
                </div>
                <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-xl w-full sm:w-52 mt-1">
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
                        checked={token.expires === TokenExpiry.sevenDays}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.sevenDays,
                          });
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
                        checked={token.expires === TokenExpiry.oneMonth}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({ ...token, expires: TokenExpiry.oneMonth });
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
                        checked={token.expires === TokenExpiry.twoMonths}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.twoMonths,
                          });
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
                        checked={token.expires === TokenExpiry.threeMonths}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({
                            ...token,
                            expires: TokenExpiry.threeMonths,
                          });
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
                        checked={token.expires === TokenExpiry.never}
                        onChange={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          setToken({ ...token, expires: TokenExpiry.never });
                        }}
                      />
                      <span className="label-text">No Expiration</span>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center mt-5">
            <button
              className="btn btn-accent dark:border-violet-400 text-white"
              onClick={submit}
            >
              Create Access Token
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
