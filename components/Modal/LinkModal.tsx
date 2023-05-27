// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LinkIncludingCollectionAndTags } from "@/types/global";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import useLinkStore from "@/store/links";
import { faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import RequiredBadge from "../RequiredBadge";
import { useSession } from "next-auth/react";
import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";

type Props =
  | {
      toggleLinkModal: Function;
      method: "CREATE";
      activeLink?: LinkIncludingCollectionAndTags;
    }
  | {
      toggleLinkModal: Function;
      method: "UPDATE";
      activeLink: LinkIncludingCollectionAndTags;
    };

export default function EditLink({
  toggleLinkModal,
  method,
  activeLink,
}: Props) {
  const { data } = useSession();

  const [link, setLink] = useState<LinkIncludingCollectionAndTags>(
    method === "UPDATE"
      ? activeLink
      : {
          name: "",
          url: "",
          title: "",
          screenshotPath: "",
          pdfPath: "",
          tags: [],
          collection: {
            name: "",
            ownerId: data?.user.id as number,
          },
        }
  );

  const { updateLink, removeLink, addLink } = useLinkStore();

  const router = useRouter();

  const { collections } = useCollectionStore();

  useEffect(() => {
    if (router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      if (currentCollection)
        setLink({
          ...link,
          collection: {
            id: currentCollection.id,
            name: currentCollection.name,
            ownerId: currentCollection.ownerId,
          },
        });
    }
  }, []);

  const shortendURL =
    method === "UPDATE" ? new URL(link.url).host.toLowerCase() : undefined;

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return { name: e.label };
    });

    setLink({ ...link, tags: tagNames });
  };

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const submit = async () => {
    let response;

    if (method === "UPDATE") response = await updateLink(link);
    else if (method === "CREATE") response = await addLink(link);

    toggleLinkModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">
        {method === "UPDATE" ? "Edit" : "New"} Link
      </p>

      {method === "UPDATE" ? (
        <p className="text-sky-700">
          <b>{shortendURL}</b> | {link.title}
        </p>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">
            Name
            <RequiredBadge />
          </p>
          <input
            value={link.name}
            onChange={(e) => setLink({ ...link, name: e.target.value })}
            type="text"
            placeholder="e.g. Example Link"
            className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        {method === "CREATE" ? (
          <div>
            <p className="text-sm font-bold text-sky-300 mb-2">
              URL
              <RequiredBadge />
            </p>
            <input
              value={link.url}
              onChange={(e) => setLink({ ...link, url: e.target.value })}
              type="text"
              placeholder="e.g. http://example.com/"
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>
        ) : null}

        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">
            Collection
            <RequiredBadge />
          </p>
          <CollectionSelection
            onChange={setCollection}
            // defaultValue={{
            //   label: link.collection.name,
            //   value: link.collection.id,
            // }}
            defaultValue={
              link.collection.name && link.collection.id
                ? {
                    value: link.collection.id,
                    label: link.collection.name,
                  }
                : undefined
            }
          />
        </div>

        <div className={method === "UPDATE" ? "sm:col-span-2" : ""}>
          <p className="text-sm font-bold text-sky-300 mb-2">Tags</p>
          <TagSelection
            onChange={setTags}
            defaultValue={link.tags.map((e) => {
              return { label: e.name, value: e.id };
            })}
          />
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-2 mt-2">
        <div
          className="bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
          onClick={submit}
        >
          <FontAwesomeIcon
            icon={method === "CREATE" ? faPlus : faPenToSquare}
            className="h-5"
          />
          {method === "CREATE" ? "Add Link" : "Edit Link"}
        </div>

        {method === "UPDATE" ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <hr className="w-16 border" />

              <p className="text-gray-400 font-bold">OR</p>

              <hr className="w-16 border" />
            </div>

            <div
              onClick={() => {
                removeLink(link);
                toggleLinkModal();
              }}
              className="w-fit inline-flex rounded-md cursor-pointer bg-red-500 hover:bg-red-400 duration-100 p-2"
            >
              <FontAwesomeIcon
                icon={faTrashCan}
                className="w-4 h-4 text-white"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
