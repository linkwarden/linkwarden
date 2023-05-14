// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import LinkList from "@/components/LinkList";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Links() {
  const { links } = useLinkStore();

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              icon={faBookmark}
              className="w-5 h-5 text-sky-300"
            />
            <p className="text-lg text-sky-900">All Links</p>
          </div>
        </div>
        {links.map((e, i) => {
          return <LinkList key={i} link={e} count={i} />;
        })}
      </div>
    </MainLayout>
  );
}
