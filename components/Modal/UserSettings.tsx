// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faClose } from "@fortawesome/free-solid-svg-icons";
import Checkbox from "../Checkbox";
import useAccountStore from "@/store/account";

type Props = {
  toggleSettingsModal: Function;
};

export default function UserSettings({ toggleSettingsModal }: Props) {
  const { account } = useAccountStore();
  const [collectionProtection, setCollectionProtection] = useState(false);

  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const submit = async () => {
    // const response = await addLink(newLink as NewLink);
    // if (response) toggleSettingsModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">Settings</p>

      <p className="text-sky-600">Profile Settings</p>

      <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">Display Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">Email</p>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        <div className="sm:row-span-2 sm:justify-self-center mb-3">
          <p className="text-sm font-bold text-sky-300 mb-2 sm:text-center">
            Profile Photo
          </p>
          <div className="w-28 h-28 flex items-center justify-center border border-sky-100 rounded-full relative">
            {/* Image goes here */}
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
        </div>
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
        label="Control who can add you to other Collections"
        state={collectionProtection}
        className="text-sm sm:text-base"
        onClick={() => setCollectionProtection(!collectionProtection)}
      />

      <div className="w-fit">
        <div
          className={`border rounded-md duration-100 bg-white px-2 py-1 text-center select-none ${
            collectionProtection
              ? "text-sky-900 border-sky-100 cursor-pointer hover:border-sky-500"
              : "text-gray-400 border-gray-100"
          }`}
        >
          Manage Allowed Users
        </div>
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        // onClick={submit}
      >
        Apply Settings
      </div>
    </div>
  );
}
