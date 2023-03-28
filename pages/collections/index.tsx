import useCollectionStore from "@/store/collections";
import { faAdd, faBox, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CollectionCard from "@/components/CollectionCard";
import Dropdown from "@/components/Dropdown";
import { useState } from "react";

export default function () {
  const { collections } = useCollectionStore();
  const [editDropdown, setEditDropdown] = useState(false);

  return (
    // ml-80
    <div className="p-5">
      <div className="flex gap-3 items-center mb-5">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faBox} className="w-5 h-5 text-sky-300" />
          <p className="text-lg text-sky-900">All Collections</p>
        </div>
        <div className="relative">
          <div
            onClick={() => setEditDropdown(!editDropdown)}
            id="edit-dropdown"
            className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              id="edit-dropdown"
              className="w-4 h-4 text-gray-500"
            />
          </div>
          {editDropdown ? (
            <Dropdown
              items={[
                {
                  name: "New",
                  icon: <FontAwesomeIcon icon={faAdd} />,
                },
              ]}
              onClickOutside={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.id !== "edit-dropdown") setEditDropdown(false);
              }}
              className="absolute top-7 left-0"
            />
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-5">
        {collections.map((e, i) => {
          return <CollectionCard key={i} collection={e} />;
        })}
      </div>
    </div>
  );
}
