import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import { HexColorPicker } from "react-colorful";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useUpdateCollection } from "@/hooks/store/collections";
import toast from "react-hot-toast";
import IconPicker from "../IconPicker";
import Icon from "../Icon";

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

  const [iconPicker, setIconPicker] = useState(false);
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
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            onClose();
            toast.success(t("updated"));
          }
        },
      });

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("edit_collection_info")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full">
            <p className="mb-2">{t("name")}</p>
            <div className="flex flex-col gap-3">
              <TextInput
                className="bg-base-200"
                value={collection.name}
                placeholder={t("collection_name_placeholder")}
                onChange={(e) =>
                  setCollection({ ...collection, name: e.target.value })
                }
              />
              <div>
                <p className="w-full mb-2">{t("color")}</p>
                <div className="color-picker flex justify-between items-center">
                  <div className="flex flex-col gap-2 items-center w-32 relative">
                    <Icon
                      icon={collection.icon as string}
                      size={80}
                      weight={collection.iconWeight as any}
                      color={collection.color as string}
                      onClick={() => setIconPicker(true)}
                    />
                    {iconPicker && (
                      <IconPicker
                        onClose={() => setIconPicker(false)}
                        className="top-20"
                        color={collection.color as string}
                        setColor={(color: string) =>
                          setCollection({ ...collection, color })
                        }
                        weight={collection.iconWeight as any}
                        setWeight={(iconWeight: string) =>
                          setCollection({ ...collection, iconWeight })
                        }
                        iconName={collection.icon as string}
                        setIconName={(icon: string) =>
                          setCollection({ ...collection, icon })
                        }
                      />
                    )}
                    <div
                      className="btn btn-ghost btn-xs"
                      onClick={() =>
                        setCollection({ ...collection, color: "#0ea5e9" })
                      }
                    >
                      {t("reset")}
                    </div>
                  </div>
                </div>
              </div>
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
          {t("save_changes")}
        </button>
      </div>
    </Modal>
  );
}
