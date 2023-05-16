// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { NewLink } from "@/types/global";
import useLinkStore from "@/store/links";
import RequiredBadge from "../RequiredBadge";

type Props = {
  toggleSettingsModal: Function;
};

export default function UserSettings({ toggleSettingsModal }: Props) {
  const [newLink, setNewLink] = useState<NewLink>();

  const { addLink } = useLinkStore();

  const submit = async () => {
    console.log(newLink);

    const response = await addLink(newLink as NewLink);

    if (response) toggleSettingsModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="font-bold text-sky-300 mb-2 text-center">Settings</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Name
          <RequiredBadge />
        </p>
        <input
          type="text"
          placeholder="e.g. Example Link"
          className="w-60 rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        // onClick={submit}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Apply Settings
      </div>
    </div>
  );
}
