import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast from "react-hot-toast";
import { HexColorPicker } from "react-colorful";
import { Collection } from "@prisma/client";
import Modal from "../Modal";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import useAccountStore from "@/store/account";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

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
  const { setAccount } = useAccountStore();
  const { data } = useSession();

  useEffect(() => {
    setCollection(initial);
  }, []);

  const [submitLoader, setSubmitLoader] = useState(false);
  const { addCollection } = useCollectionStore();

  const submit = async () => {
    if (submitLoader) return;
    if (!collection) return null;

    setSubmitLoader(true);

    const load = toast.loading(t("creating"));

    let response = await addCollection(collection as any);
    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("created_success"));
      if (response.data) {
        setAccount(data?.user.id as number);
        onClose();
      }
    } else toast.error(response.data as string);

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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full">
            <p className="mb-2">{t("name")}</p>
            <div className="flex flex-col gap-2">
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
                  <HexColorPicker
                    color={collection.color}
                    onChange={(color) =>
                      setCollection({ ...collection, color })
                    }
                  />
                  <div className="flex flex-col gap-2 items-center w-32">
                    <i
                      className={"bi-folder-fill text-5xl"}
                      style={{ color: collection.color }}
                    ></i>
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
          {t("create_collection_button")}
        </button>
      </div>
    </Modal>
  );
}
