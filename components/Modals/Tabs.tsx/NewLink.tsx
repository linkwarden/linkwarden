import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function NewLink() {
  const newModal = document.getElementById("new-modal");
  const { data } = useSession();

  const initial = {
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
  };

  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(initial);

  const { addLink } = useLinkStore();
  const [submitLoader, setSubmitLoader] = useState(false);

  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const router = useRouter();
  const { collections } = useCollectionStore();

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
    const resetModal = () => {
      setLink(initial);

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
    };
    resetModal();

    newModal?.addEventListener("close", () => {
      resetModal();
    });

    return () => {
      newModal?.addEventListener("close", () => {
        resetModal();
      });
    };
  }, []);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      let response;

      const load = toast.loading("Creating...");

      response = await addLink(link);

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Created!`);
        (newModal as any).close();

        setLink(initial);
      } else toast.error(response.data as string);

      setSubmitLoader(false);

      return response;
    }
  };

  return (
    <div>
      <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
        <div className="sm:col-span-3 col-span-5">
          <p className="mb-2">Link</p>
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

      {optionsExpanded ? (
        <div className="mt-5">
          {/* <hr className="mb-3 border border-neutral-content" /> */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="mb-2">Name</p>
              <TextInput
                value={link.name}
                onChange={(e) => setLink({ ...link, name: e.target.value })}
                placeholder="e.g. Example Link"
                className="bg-base-200"
              />
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
      ) : undefined}

      <div className="flex justify-between items-center mt-5">
        <div
          onClick={() => setOptionsExpanded(!optionsExpanded)}
          className={`rounded-md cursor-pointer btn btn-sm btn-ghost duration-100 flex items-center px-2 w-fit text-sm`}
        >
          <p>{optionsExpanded ? "Hide" : "More"} Options</p>
        </div>

        <button className="btn btn-accent" onClick={submit}>
          Create Link
        </button>
      </div>
    </div>
  );
}
