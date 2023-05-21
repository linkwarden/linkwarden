// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faClose } from "@fortawesome/free-solid-svg-icons";
import Checkbox from "../Checkbox";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { useSession } from "next-auth/react";

type Props = {
  toggleSettingsModal: Function;
};

export default function UserSettings({ toggleSettingsModal }: Props) {
  const { update } = useSession();
  const { account, updateAccount } = useAccountStore();

  let initialUser = {
    name: account.name,
    email: account.email,
    collectionProtection: account.collectionProtection,
    whitelistedUsers: account.whitelistedUsers,
  };

  const [user, setUser] = useState<AccountSettings>(initialUser);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e: any) => {
    setSelectedFile(e.target.files[0]);
  };

  const stateIsTampered = () => {
    return JSON.stringify(user) !== JSON.stringify(initialUser);
  };

  const submit = async () => {
    await updateAccount(user);

    initialUser = {
      name: account.name,
      email: account.email,
      collectionProtection: account.collectionProtection,
      whitelistedUsers: account.whitelistedUsers,
    };

    console.log({ email: user.email, name: user.name });

    if (user.email !== initialUser.email || user.name !== initialUser.name)
      update({ email: user.email, name: user.name });
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">Settings</p>

      <p className="text-sky-600">Profile Settings</p>

      {user.email !== initialUser.email || user.name !== initialUser.name ? (
        <p className="text-gray-500 text-sm">
          Note: The page will be refreshed to apply the changes of "Email" or
          "Display Name".
        </p>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">Display Name</p>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">Email</p>
            <input
              type="text"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">Password</p>

            <div className="w-fit">
              <div className="border border-sky-100 rounded-md bg-white px-2 py-1 text-center select-none cursor-pointer text-sky-900 duration-100 hover:border-sky-500">
                Change Password
              </div>
            </div>
          </div>
        </div>

        {/* <div className="sm:row-span-2 sm:justify-self-center mb-3">
          <p className="text-sm font-bold text-sky-300 mb-2 sm:text-center">
            Profile Photo
          </p>
          <div className="w-28 h-28 flex items-center justify-center border border-sky-100 rounded-full relative">
            // Image goes here 
            <FontAwesomeIcon
              icon={faCircleUser}
              className="w-28 h-28 text-sky-500"
            />
            <div className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center border p-1 bg-white border-sky-100 rounded-full text-gray-500 hover:text-red-500 duration-100 cursor-pointer">
              <FontAwesomeIcon icon={faClose} className="w-3 h-3" />
            </div>
            <div className="absolute -bottom-2 left-0 right-0 mx-auto w-fit text-center">
              <label
                htmlFor="upload-photo"
                title="PNG or JPG (Max: 3MB)"
                className="border border-sky-100 rounded-md bg-white px-2 text-center select-none cursor-pointer text-sky-900 duration-100 hover:border-sky-500"
              >
                Browse...
                <input
                  type="file"
                  name="photo"
                  id="upload-photo"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div> */}
      </div>

      <hr />

      <p className="text-sky-600">Data Settings</p>

      <div className="w-fit">
        <div className="border border-sky-100 rounded-md bg-white px-2 py-1 text-center select-none cursor-pointer text-sky-900 duration-100 hover:border-sky-500">
          Export Data
        </div>
      </div>

      <hr />

      <p className="text-sky-600">Privacy Settings</p>

      <Checkbox
        label="Limit who can add you to other Collections"
        state={user.collectionProtection}
        className="text-sm sm:text-base"
        onClick={() =>
          setUser({ ...user, collectionProtection: !user.collectionProtection })
        }
      />

      {user.collectionProtection ? (
        <div>
          <p className="text-gray-500 text-sm mb-3">
            Please enter the email addresses of the users who are allowed to add
            you to additional collections in the box below, separated by spaces.
          </p>
          <textarea
            autoFocus
            className="w-full resize-none border rounded-md duration-100 bg-white p-2 outline-none border-sky-100 focus:border-sky-500"
            placeholder="No one can add you to any collections right now..."
          ></textarea>
        </div>
      ) : null}

      {stateIsTampered() ? (
        <div
          className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
          onClick={submit}
        >
          Apply Settings
        </div>
      ) : null}
    </div>
  );
}
