import { Tab } from "@headlessui/react";
import CollectionInfo from "./CollectionInfo";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import TeamManagement from "./TeamManagement";
import { useState } from "react";
import DeleteCollection from "./DeleteCollection";

type Props =
  | {
      toggleCollectionModal: Function;
      activeCollection: CollectionIncludingMembersAndLinkCount;
      method: "UPDATE";
      className?: string;
      defaultIndex?: number;
    }
  | {
      toggleCollectionModal: Function;
      activeCollection?: CollectionIncludingMembersAndLinkCount;
      method: "CREATE";
      className?: string;
      defaultIndex?: number;
    };

export default function CollectionModal({
  className,
  defaultIndex,
  toggleCollectionModal,
  activeCollection,
  method,
}: Props) {
  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      activeCollection || {
        name: "",
        description: "",
        color: "#0ea5e9",
        isPublic: false,
        members: [],
      }
    );

  return (
    <div className={className}>
      <Tab.Group defaultIndex={defaultIndex}>
        {method === "CREATE" && (
          <p className="text-xl text-sky-500 text-center">New Collection</p>
        )}
        <Tab.List className="flex justify-center flex-col max-w-[15rem] mx-auto sm:flex-row gap-2 sm:gap-3 mb-5 text-sky-600">
          {method === "UPDATE" && (
            <>
              <Tab
                className={({ selected }) =>
                  selected
                    ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                    : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
                }
              >
                Collection Info
              </Tab>
              <Tab
                className={({ selected }) =>
                  selected
                    ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                    : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
                }
              >
                Share & Collaborate
              </Tab>
              <Tab
                className={({ selected }) =>
                  selected
                    ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                    : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
                }
              >
                Delete Collection
              </Tab>
            </>
          )}
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <CollectionInfo
              toggleCollectionModal={toggleCollectionModal}
              setCollection={setCollection}
              collection={collection}
              method={method}
            />
          </Tab.Panel>

          {method === "UPDATE" && (
            <>
              <Tab.Panel>
                <TeamManagement
                  toggleCollectionModal={toggleCollectionModal}
                  setCollection={setCollection}
                  collection={collection}
                  method={method}
                />
              </Tab.Panel>
              <Tab.Panel>
                <DeleteCollection
                  toggleDeleteCollectionModal={toggleCollectionModal}
                  collection={collection}
                />
              </Tab.Panel>
            </>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
