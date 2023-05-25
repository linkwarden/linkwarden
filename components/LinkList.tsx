// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { ExtendedLink } from "@/types/global";
import {
  faFolder,
  faArrowUpRightFromSquare,
  faEllipsis,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { faFileImage, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Image from "next/image";
import Dropdown from "./Dropdown";
import useLinkStore from "@/store/links";
import Modal from "./Modal";
import EditLink from "./Modal/EditLink";
import Link from "next/link";

export default function ({
  link,
  count,
}: {
  link: ExtendedLink;
  count: number;
}) {
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const { removeLink } = useLinkStore();

  const url = new URL(link.url);
  const formattedDate = new Date(link.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  return (
    <div className="border border-sky-100 bg-gray-100 p-5 rounded-md flex items-start relative gap-5 sm:gap-10 group/item">
      {editModal ? (
        <Modal toggleModal={toggleEditModal}>
          <EditLink toggleLinkModal={toggleEditModal} link={link} />
        </Modal>
      ) : null}

      <Image
        src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
        width={42}
        height={42}
        alt=""
        className="select-none mt-3 z-10 rounded-full shadow border-[3px] border-sky-100"
        draggable="false"
        onError={(e) => {
          const target = e.target as HTMLElement;
          target.style.opacity = "0";
        }}
      />
      <Image
        src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
        width={80}
        height={80}
        alt=""
        className="blur-sm absolute left-2 opacity-40 select-none hidden sm:block"
        draggable="false"
        onError={(e) => {
          const target = e.target as HTMLElement;
          target.style.opacity = "0";
        }}
      />
      <div className="flex justify-between gap-5 w-full h-full z-0">
        <div className="flex flex-col justify-between">
          <div className="flex items-baseline gap-1">
            <p className="text-sm text-sky-300 font-bold">{count + 1}.</p>
            <p className="text-lg text-sky-600">{link.name}</p>
          </div>
          <p className="text-sky-400 text-sm font-medium">{link.title}</p>
          <div className="flex gap-3 items-center flex-wrap my-3">
            <Link href={`/collections/${link.collection.id}`}>
              <div className="flex items-center gap-1 cursor-pointer hover:opacity-60 duration-100">
                <FontAwesomeIcon icon={faFolder} className="w-4 text-sky-300" />
                <p className="text-sky-900">{link.collection.name}</p>
              </div>
            </Link>

            <div className="flex gap-1 items-center flex-wrap">
              {link.tags.map((e, i) => (
                <Link key={i} href={`/tags/${e.id}`}>
                  <p className="px-2 py-1 bg-sky-200 text-sky-700 text-xs rounded-3xl cursor-pointer hover:bg-sky-100 duration-100">
                    # {e.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <p className="text-gray-500">{formattedDate}</p>
            <a href={link.url} target="_blank" className="group/url">
              <div className="text-gray-500 font-bold flex items-center gap-1">
                <p>{url.host}</p>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="w-3 opacity-0 group-hover/url:opacity-100 duration-75"
                />
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-between items-end relative">
          <div
            onClick={() => setExpandDropdown(!expandDropdown)}
            id="edit-dropdown"
            className="text-gray-500 inline-flex rounded-md cursor-pointer hover:bg-white hover:outline outline-sky-100 outline-1 duration-100 p-1"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              title="More"
              className="w-5 h-5"
              id="edit-dropdown"
            />
          </div>
          <div className="relative">
            <div className="flex flex-col items-end justify-center gap-1">
              <a
                href={`/api/archives/${link.collectionId}/${encodeURIComponent(
                  link.screenshotPath
                )}`}
                target="_blank"
                title="Screenshot"
              >
                <FontAwesomeIcon
                  icon={faFileImage}
                  className="w-5 h-5 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                />
              </a>
              <a
                href={`/api/archives/${link.collectionId}/${encodeURIComponent(
                  link.pdfPath
                )}`}
                target="_blank"
                title="PDF"
              >
                <FontAwesomeIcon
                  icon={faFilePdf}
                  className="w-5 h-5 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                />
              </a>
            </div>
          </div>

          {expandDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Edit",
                  icon: <FontAwesomeIcon icon={faPenToSquare} />,
                  onClick: () => {
                    setEditModal(true);
                    setExpandDropdown(false);
                  },
                },
                {
                  name: "Delete",
                  icon: <FontAwesomeIcon icon={faTrashCan} />,
                  onClick: () => {
                    removeLink(link);
                    setExpandDropdown(false);
                  },
                },
              ]}
              onClickOutside={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.id !== "edit-dropdown") setExpandDropdown(false);
              }}
              className="absolute top-8 right-0 w-36"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
