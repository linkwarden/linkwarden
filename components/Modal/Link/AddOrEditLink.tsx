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
    if (router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      if (currentCollection && currentCollection.ownerId)
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
          className="text-gray-500 my-2 text-center truncate w-full"
          title={link.url}
        >
          <Link href={link.url} target="_blank" className=" font-bold">
            {link.url}
          </Link>
        </p>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        {method === "CREATE" ? (
          <div className="sm:col-span-2">
            <p className="text-sm text-sky-700 mb-2">
              URL
              <RequiredBadge />
            </p>
            <input
              value={link.url}
              onChange={(e) => setLink({ ...link, url: e.target.value })}
              type="text"
              placeholder="e.g. http://example.com/"
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
            />
          </div>
        ) : null}

        <div>
          <p className="text-sm text-sky-700 mb-2">Collection</p>
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

        <div>
          <p className="text-sm text-sky-700 mb-2">Tags</p>
          <TagSelection
            onChange={setTags}
            defaultValue={link.tags.map((e) => {
              return { label: e.name, value: e.id };
            })}
          />
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm text-sky-700 mb-2">Name</p>
          <input
            value={link.name}
            onChange={(e) => setLink({ ...link, name: e.target.value })}
            type="text"
            placeholder="e.g. Example Link"
            className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
          />
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm text-sky-700 mb-2">Description</p>
          <textarea
            value={link.description}
            onChange={(e) => setLink({ ...link, description: e.target.value })}
            placeholder={
              method === "CREATE"
                ? "Will be auto generated if nothing is provided."
                : ""
            }
            className="resize-none w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-700 duration-100"
          />
        </div>
      </div>

      <SubmitButton
        onClick={submit}
        label={method === "CREATE" ? "Add" : "Save"}
        icon={method === "CREATE" ? faPlus : faPenToSquare}
        loading={submitLoader}
        className={`mx-auto mt-2`}
      />
    </div>
  );
}
