import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast from "react-hot-toast";
import { HexColorPicker } from "react-colorful";
import { Collection } from "@prisma/client";
import Modal from "../Modal";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import useAccountStore from "@/store/account";
import { useSession } from "next-auth/react";

type Props = {
  onClose: Function;
  parent?: CollectionIncludingMembersAndLinkCount;
};

export default function NewCollectionModal({ onClose, parent }: Props) {
  const initial = {
    parentId: parent?.id,
    name: "",
    description: "",
    color: "#0ea5e9",
  } as Partial<Collection>;

  const [collection, setCollection] = useState<Partial<Collection>>(initial);
  const { setAccount } = useAccountStore();
  const { data } = useSession();

  useEffect(() => {
    setCollection(initial);
  }, []);

  const [submitLoader, setSubmitLoader] = useState(false);
  const { addCollection } = useCollectionStore();

  const submit = async () => {
    if (submitLoader) return;
    if (!collection) return null;

    setSubmitLoader(true);

    const load = toast.loading("Creating...");

    let response = await addCollection(collection as any);
    toast.dismiss(load);

    if (response.ok) {
      toast.success("Created!");
      if (response.data) {
        // If the collection was created successfully, we need to get the new collection order
        setAccount(data?.user.id as number);
        onClose();
      }
    } else toast.error(response.data as string);

    setSubmitLoader(false);
  };

  return (
    <Modal toggleModal={onClose}>
      {parent?.id ? (
        <>
          <p className="text-xl font-thin">New Sub-Collection</p>
          <p className="capitalize text-sm">For {parent.name}</p>
        </>
      ) : (
        <p className="text-xl font-thin">Create a New Collection</p>
      )}

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full">
            <p className="mb-2">Name</p>
            <div className="flex flex-col gap-3">
              <TextInput
                className="bg-base-200"
                value={collection.name}
                placeholder="e.g. Example Collection"
                onChange={(e) =>
                  setCollection({ ...collection, name: e.target.value })
                }
              />
              <div>
                <p className="w-full mb-2">Color</p>
                <div className="color-picker flex justify-between">
                  <div className="flex flex-col gap-2 items-center w-32">
                    <i
                      className={"bi-folder-fill text-5xl"}
                      style={{ color: collection.color }}
                    ></i>
                    <div
                      className="btn btn-ghost btn-xs"
                      onClick={() =>
                        setCollection({ ...collection, color: "#0ea5e9" })
                      }
                    >
                      Reset
                    </div>
                  </div>
                  <HexColorPicker
                    color={collection.color}
                    onChange={(e) => setCollection({ ...collection, color: e })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2">Description</p>
            <textarea
              className="w-full h-[13rem] resize-none border rounded-md duration-100 bg-base-200 p-2 outline-none border-neutral-content focus:border-primary"
              placeholder="The purpose of this Collection..."
              value={collection.description}
              onChange={(e) =>
                setCollection({
                  ...collection,
                  description: e.target.value,
                })
              }
            />
          </div>
        </div>

        <button
          className="btn btn-accent dark:border-violet-400 text-white w-fit ml-auto"
          onClick={submit}
        >
          Create Collection
        </button>
      </div>
    </Modal>
  );
}
