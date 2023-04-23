// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { ReactNode } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";

type Props = {
  toggleModal: Function;
  children: ReactNode;
};

export default function ({ toggleModal, children }: Props) {
  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in z-30">
      <ClickAwayHandler onClickOutside={toggleModal} className="w-fit mx-auto">
        <div className="slide-up border-sky-100 rounded-md border-solid border shadow-lg p-5 bg-white">
          {children}
        </div>
      </ClickAwayHandler>
    </div>
  );
}
