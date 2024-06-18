import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast from "react-hot-toast";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function DeleteCollectionModal({
  onClose,
  activeCollection,
}: Props) {
  const { t } = useTranslation();
  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);
  const [submitLoader, setSubmitLoader] = useState(false);
  const { removeCollection } = useCollectionStore();
  const router = useRouter();
  const [inputField, setInputField] = useState("");
  const permissions = usePermissions(collection.id as number);

  useEffect(() => {
    setCollection(activeCollection);
  }, []);

  const submit = async () => {
    if (permissions === true && collection.name !== inputField) return;
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading(t("deleting_collection"));

      let response = await removeCollection(collection.id as number);

      toast.dismiss(load);

      if (response.ok) {
        toast.success(t("deleted"));
        onClose();
        router.push("/collections");
      } else {
        toast.error(response.data as string);
      }

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {permissions === true ? t("delete_collection") : t("leave_collection")}
      </p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        {permissions === true ? (
          <>
            <p>{t("confirm_deletion_prompt", { name: collection.name })}</p>
            <TextInput
              value={inputField}
              onChange={(e) => setInputField(e.target.value)}
              placeholder={t("type_name_placeholder", {
                name: collection.name,
              })}
              className="w-3/4 mx-auto"
            />

            <div role="alert" className="alert alert-warning">
              <i className="bi-exclamation-triangle text-xl"></i>
              <span>
                <b>{t("warning")}: </b>
                {t("deletion_warning")}
              </span>
            </div>
          </>
        ) : (
          <p>{t("leave_prompt")}</p>
        )}

        <Button
          disabled={permissions === true && inputField !== collection.name}
          onClick={submit}
          intent="destructive"
          className="ml-auto"
        >
          <i className="bi-trash text-xl"></i>
          {permissions === true ? t("delete") : t("leave")}
        </Button>
      </div>
    </Modal>
  );
}
