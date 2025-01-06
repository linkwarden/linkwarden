import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useUpdateCollection } from "@/hooks/store/collections";
import toast from "react-hot-toast";
import IconPicker from "../IconPicker";
import { IconWeight } from "@phosphor-icons/react";
import oklchVariableToHex from "@/lib/client/oklchVariableToHex";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function EditCollectionModal({
  onClose,
  activeCollection,
}: Props) {
  const { t } = useTranslation();
  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);

  const [submitLoader, setSubmitLoader] = useState(false);
  const updateCollection = useUpdateCollection();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading(t("updating_collection"));

      await updateCollection.mutateAsync(collection, {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            onClose();
            toast.success(t("updated"));
          }
        },
      });
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("edit_collection_info")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <IconPicker
              color={collection.color}
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
                  color: oklchVariableToHex("--p"),
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
              className="w-full h-32 resize-none border rounded-md duration-100 bg-base-200 p-2 outline-none border-neutral-content focus:border-primary"
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
          {t("save_changes")}
        </button>
      </div>
    </Modal>
  );
}
