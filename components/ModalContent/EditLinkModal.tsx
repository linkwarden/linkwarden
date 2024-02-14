import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import Modal from "../Modal";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function EditLinkModal({ onClose, activeLink }: Props) {
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  let shortendURL;

  try {
    shortendURL = new URL(link.url || "").host.toLowerCase();
  } catch (error) {
    console.log(error);
  }

  const { updateLink } = useLinkStore();
  const [submitLoader, setSubmitLoader] = useState(false);

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return { name: e.label };
    });

    setLink({ ...link, tags: tagNames });
  };

  useEffect(() => {
    setLink(activeLink);
  }, []);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      let response;

      const load = toast.loading("Updating...");

      response = await updateLink(link);

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Updated!`);
        onClose();
      } else toast.error(response.data as string);

      setSubmitLoader(false);

      return response;
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Edit Link</p>

      <div className="divider mb-3 mt-1"></div>

      {link.url ? (
        <Link
          href={link.url}
          className="truncate text-neutral flex gap-2 mb-5 w-fit max-w-full"
          title={link.url}
          target="_blank"
        >
          <i className="bi-link-45deg text-xl" />
          <p>{shortendURL}</p>
        </Link>
      ) : undefined}

      <div className="w-full">
        <p className="mb-2">Name</p>
        <TextInput
          value={link.name}
          onChange={(e) => setLink({ ...link, name: e.target.value })}
          placeholder="e.g. Example Link"
          className="bg-base-200"
        />
      </div>

      <div className="mt-5">
        {/* <hr className="mb-3 border border-neutral-content" /> */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">Collection</p>
            {link.collection.name ? (
              <CollectionSelection
                onChange={setCollection}
                // defaultValue={{
                //   label: link.collection.name,
                //   value: link.collection.id,
                // }}
                defaultValue={
                  link.collection.id
                    ? {
                        value: link.collection.id,
                        label: link.collection.name,
                      }
                    : {
                        value: null as unknown as number,
                        label: "Unorganized",
                      }
                }
                creatable={false}
              />
            ) : null}
          </div>

          <div>
            <p className="mb-2">Tags</p>
            <TagSelection
              onChange={setTags}
              defaultValue={link.tags.map((e) => {
                return { label: e.name, value: e.id };
              })}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2">Description</p>
            <textarea
              value={unescapeString(link.description) as string}
              onChange={(e) =>
                setLink({ ...link, description: e.target.value })
              }
              placeholder="Will be auto generated if nothing is provided."
              className="resize-none w-full rounded-md p-2 border-neutral-content bg-base-200 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-5">
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
