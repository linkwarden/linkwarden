import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast, { Toaster } from "react-hot-toast";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { HexColorPicker } from "react-colorful";
import { Collection } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from "../Modal";

type Props = {
  onClose: Function;
};

export default function NewCollectionModal({ onClose }: Props) {
  const initial = {
    name: "",
    description: "",
    color: "#0ea5e9",
  };

  const [collection, setCollection] = useState<Partial<Collection>>(initial);

  useEffect(() => {
    setCollection(initial);
  }, []);

  const [submitLoader, setSubmitLoader] = useState(false);
  const { addCollection } = useCollectionStore();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading("Creating...");

      let response;

      response = await addCollection(collection as any);

      toast.dismiss(load);

      if (response.ok) {
        toast.success("Created!");
        onClose();
      } else toast.error(response.data as string);

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl mb-5 font-thin">Create a New Collection</p>

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
                    <div style={{ color: collection.color }}>
                      <FontAwesomeIcon
                        icon={faFolder}
                        className="w-12 h-12 drop-shadow"
                      />
                    </div>
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

        <button className="btn btn-accent w-fit ml-auto" onClick={submit}>
          Create Collection
        </button>
      </div>
    </Modal>
  );
}
