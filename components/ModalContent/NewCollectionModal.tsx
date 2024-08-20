import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import { Collection } from "@prisma/client";
import Modal from "../Modal";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useTranslation } from "next-i18next";
import { useCreateCollection } from "@/hooks/store/collections";
import toast from "react-hot-toast";
import IconPicker from "../IconPicker";
import { IconWeight } from "@phosphor-icons/react";

type Props = {
  onClose: Function;
  parent?: CollectionIncludingMembersAndLinkCount;
};

export default function NewCollectionModal({ onClose, parent }: Props) {
  const { t } = useTranslation();
  const initial = {
    parentId: parent?.id,
    name: "",
    description: "",
    color: "#0ea5e9",
  } as Partial<Collection>;

  const [collection, setCollection] = useState<Partial<Collection>>(initial);

  useEffect(() => {
    setCollection(initial);
  }, []);

  const [submitLoader, setSubmitLoader] = useState(false);

  const createCollection = useCreateCollection();

  const submit = async () => {
    if (submitLoader) return;
    if (!collection) return null;

    setSubmitLoader(true);

    const load = toast.loading(t("creating"));

    await createCollection.mutateAsync(collection, {
      onSettled: (data, error) => {
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          onClose();
          toast.success(t("created"));
        }
      },
    });

    setSubmitLoader(false);
  };

  return (
    <Modal toggleModal={onClose}>
      {parent?.id ? (
        <>
          <p className="text-xl font-thin">{t("new_sub_collection")}</p>
          <p className="capitalize text-sm">
            {t("for_collection", { name: parent.name })}
          </p>
        </>
      ) : (
        <p className="text-xl font-thin">{t("create_new_collection")}</p>
      )}

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <IconPicker
              color={collection.color || "#0ea5e9"}
              setColor={(color: string) =>
                setCollection({ ...collection, color })
              }
              weight={(collection.iconWeight || "regular") as IconWeight}
              setWeight={(iconWeight: string) =>
                setCollection({ ...collection, iconWeight })
              }
              iconName={collection.icon as string}
              setIconName={(icon: string) =>
                setCollection({ ...collection, icon })
              }
              reset={() =>
                setCollection({
                  ...collection,
                  color: "#0ea5e9",
                  icon: "",
                  iconWeight: "",
                })
              }
            />
            <div className="w-full">
              <p className="mb-2">{t("name")}</p>
              <TextInput
                className="bg-base-200"
                value={collection.name}
                placeholder={t("collection_name_placeholder")}
                onChange={(e) =>
                  setCollection({ ...collection, name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2">{t("description")}</p>
            <textarea
              className="w-full h-[13rem] resize-none border rounded-md duration-100 bg-base-200 p-2 outline-none border-neutral-content focus:border-primary"
              placeholder={t("collection_description_placeholder")}
              value={collection.description}
              onChange={(e) =>
                setCollection({ ...collection, description: e.target.value })
              }
            />
          </div>
        </div>

        <button
          className="btn btn-accent dark:border-violet-400 text-white w-fit ml-auto"
          onClick={submit}
        >
          {t("create_collection_button")}
        </button>
      </div>
    </Modal>
  );
}
