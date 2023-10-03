import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import useLinkStore from "@/store/links";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import RequiredBadge from "../../RequiredBadge";
import { useSession } from "next-auth/react";
import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";
import SubmitButton from "../../SubmitButton";
import { toast } from "react-hot-toast";
import Link from "next/link";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";

type Props =
  | {
      toggleLinkModal: Function;
      method: "CREATE";
      activeLink?: LinkIncludingShortenedCollectionAndTags;
    }
  | {
      toggleLinkModal: Function;
      method: "UPDATE";
      activeLink: LinkIncludingShortenedCollectionAndTags;
    };

export default function AddOrEditLink({
  toggleLinkModal,
  method,
  activeLink,
}: Props) {
  const [submitLoader, setSubmitLoader] = useState(false);

  const [optionsExpanded, setOptionsExpanded] = useState(
    method === "UPDATE" ? true : false
  );

  const { data } = useSession();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>(
    activeLink || {
      name: "",
      url: "",
      description: "",
      tags: [],
      collection: {
        name: "",
        ownerId: data?.user.id as number,
      },
    }
  );

  const { updateLink, addLink } = useLinkStore();

  const router = useRouter();
  const { collections } = useCollectionStore();

  useEffect(() => {
    if (method === "CREATE") {
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
    }
  }, []);

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
    setSubmitLoader(true);

    let response;
    const load = toast.loading(
      method === "UPDATE" ? "Applying..." : "Creating..."
    );

    if (method === "UPDATE") response = await updateLink(link);
    else response = await addLink(link);

    toast.dismiss(load);

    if (response.ok) {
      toast.success(`Link ${method === "UPDATE" ? "Saved!" : "Created!"}`);
      toggleLinkModal();
    } else toast.error(response.data as string);

    setSubmitLoader(false);

    return response;
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      {method === "UPDATE" ? (
        <p
          className="text-gray-500 dark:text-gray-300 text-center truncate w-full"
          title={link.url}
        >
          <Link href={link.url} target="_blank" className="font-bold">
            {link.url}
          </Link>
        </p>
      ) : null}

      {method === "CREATE" ? (
        <div className="grid grid-flow-row-dense sm:grid-cols-5 gap-3">
          <div className="sm:col-span-3 col-span-5">
            <p className="text-sm text-black dark:text-white mb-2 font-bold">
              Address (URL)
              <RequiredBadge />
            </p>
            <TextInput
              value={link.url}
              onChange={(e) => setLink({ ...link, url: e.target.value })}
              placeholder="e.g. http://example.com/"
            />
          </div>
          <div className="sm:col-span-2 col-span-5">
            <p className="text-sm text-black dark:text-white mb-2">
              Collection
            </p>
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
      ) : undefined}

      {optionsExpanded ? (
        <div>
          <hr className="mb-3 border border-sky-100 dark:border-neutral-700" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={`${method === "UPDATE" ? "sm:col-span-2" : ""}`}>
              <p className="text-sm text-black dark:text-white mb-2">Name</p>
              <TextInput
                value={link.name}
                onChange={(e) => setLink({ ...link, name: e.target.value })}
                placeholder="e.g. Example Link"
              />
            </div>

            {method === "UPDATE" ? (
              <div>
                <p className="text-sm text-black dark:text-white mb-2">
                  Collection
                </p>
                {link.collection.name ? (
                  <CollectionSelection
                    onChange={setCollection}
                    defaultValue={
                      link.collection.name && link.collection.id
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
                ) : undefined}
              </div>
            ) : undefined}

            <div>
              <p className="text-sm text-black dark:text-white mb-2">Tags</p>
              <TagSelection
                onChange={setTags}
                defaultValue={link.tags.map((e) => {
                  return { label: e.name, value: e.id };
                })}
              />
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-black dark:text-white mb-2">
                Description
              </p>
              <textarea
                value={unescapeString(link.description) as string}
                onChange={(e) =>
                  setLink({ ...link, description: e.target.value })
                }
                placeholder={
                  method === "CREATE"
                    ? "Will be auto generated if nothing is provided."
                    : ""
                }
                className="resize-none w-full rounded-md p-2 border-sky-100 bg-gray-50 dark:border-neutral-700 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100 dark:bg-neutral-950"
              />
            </div>
          </div>
        </div>
      ) : undefined}

      <div className="flex justify-between items-center mt-2">
        <div
          onClick={() => setOptionsExpanded(!optionsExpanded)}
          className={`${
            method === "UPDATE" ? "hidden" : ""
          } rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 py-1 px-2 w-fit text-sm`}
        >
          {optionsExpanded ? "Hide" : "More"} Options
        </div>

        <SubmitButton
          onClick={submit}
          label={method === "CREATE" ? "Add" : "Save"}
          icon={method === "CREATE" ? faPlus : faPenToSquare}
          loading={submitLoader}
          className={`${method === "CREATE" ? "" : "mx-auto"}`}
        />
      </div>
    </div>
  );
}
