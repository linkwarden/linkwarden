import { Tab } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import TextInput from "../TextInput";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useRouter } from "next/router";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { useSession } from "next-auth/react";
import CollectionSelection from "../InputSelect/CollectionSelection";

export default function New() {
  const { data } = useSession();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>({
    name: "",
    url: "",
    description: "",
    tags: [],
    screenshotPath: "",
    pdfPath: "",
    readabilityPath: "",
    textContent: "",
    collection: {
      name: "",
      ownerId: data?.user.id as number,
    },
  });

  const { updateLink, addLink } = useLinkStore();

  const router = useRouter();
  const { collections } = useCollectionStore();

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  useEffect(() => {
    if (router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      if (
        currentCollection &&
        currentCollection.ownerId &&
        router.asPath.startsWith("/collections/")
      )
        setLink({
          ...link,
          collection: {
            id: currentCollection.id,
            name: currentCollection.name,
            ownerId: currentCollection.ownerId,
          },
        });
    } else
      setLink({
        ...link,
        collection: {
          // id: ,
          name: "Unorganized",
          ownerId: data?.user.id as number,
        },
      });
  }, []);

  return (
    <dialog id="new-link-modal" className="modal backdrop-blur-sm">
      <div className="modal-box border border-neutral-content">
        <form method="dialog">
          <button className="btn btn-sm outline-none btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>

        <Tab.Group>
          <Tab.List className="tabs-boxed flex w-fit mr-auto justify-center gap-1 p-1">
            <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm`
              }
            >
              Link
            </Tab>
            {/* <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm`
              }
            >
              File
            </Tab> */}
            <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm`
              }
            >
              Collection
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-5">
            <Tab.Panel>
              <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
                <div className="sm:col-span-3 col-span-5">
                  <p className="mb-2">Address (URL)</p>
                  <TextInput
                    value={link.url}
                    onChange={(e) => setLink({ ...link, url: e.target.value })}
                    placeholder="e.g. http://example.com/"
                    className="bg-base-200"
                  />
                </div>
                <div className="sm:col-span-2 col-span-5">
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
                    />
                  ) : null}
                </div>
              </div>
            </Tab.Panel>
            {/* <Tab.Panel>Content 2</Tab.Panel> */}
            <Tab.Panel>Content 3</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
