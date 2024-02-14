import React, { useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";

type Props = {
  onClose: Function;
};

export default function BulkEditLinksModal({ onClose }: Props) {
  const { updateLinks, selectedLinks, setSelectedLinks } = useLinkStore();
  const [submitLoader, setSubmitLoader] = useState(false);
  const [removePreviousTags, setRemovePreviousTags] = useState(false);
  const [updatedValues, setUpdatedValues] = useState<
    Pick<LinkIncludingShortenedCollectionAndTags, "tags" | "collectionId">
  >({ tags: [] });

  const setCollection = (e: any) => {
    const collectionId = e?.value || null;
    console.log(updatedValues);
    setUpdatedValues((prevValues) => ({ ...prevValues, collectionId }));
  };

  const setTags = (e: any) => {
    const tags = e.map((tag: any) => ({ name: tag.label }));
    setUpdatedValues((prevValues) => ({ ...prevValues, tags }));
  };

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading("Updating...");

      const response = await updateLinks(
        selectedLinks,
        removePreviousTags,
        updatedValues
      );

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Updated!`);
        setSelectedLinks([]);
        onClose();
      } else toast.error(response.data as string);

      setSubmitLoader(false);
      return response;
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">
        Edit {selectedLinks.length} Link{selectedLinks.length > 1 ? "s" : ""}
      </p>
      <div className="divider mb-3 mt-1"></div>
      <div className="mt-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">Move to Collection</p>
            <CollectionSelection
              showDefaultValue={false}
              onChange={setCollection}
              creatable={false}
            />
          </div>

          <div>
            <p className="mb-2">Add Tags</p>
            <TagSelection onChange={setTags} />
          </div>
        </div>
        <div className="sm:ml-auto w-1/2 p-3">
          <label className="flex items-center gap-2 ">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={removePreviousTags}
              onChange={(e) => setRemovePreviousTags(e.target.checked)}
            />
            Remove previous tags
          </label>
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
