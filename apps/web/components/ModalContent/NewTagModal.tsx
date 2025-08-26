import React, { useLayoutEffect, useRef, useState } from "react";
import TextInput from "@/components/TextInput";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { Separator } from "../ui/separator";
import { useUpsertTags } from "@linkwarden/router/tags";

type Props = {
  onClose: Function;
};

export default function NewTagModal({ onClose }: Props) {
  const { t } = useTranslation();
  const upsertTags = useUpsertTags();

  const initial = {
    label: "",
  };

  const [tag, setTag] = useState(initial);
  const [submitLoader, setSubmitLoader] = useState(false);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading(t("creating"));

      await upsertTags.mutateAsync([tag], {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);
          if (error) {
            toast.error(t(error.message));
          } else {
            onClose();
            toast.success(t("created"));
          }
        },
      });
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("create_new_tag")}</p>

      <Separator className="my-3" />

      <div className="w-full">
        <p className="mb-2">{t("name")}</p>

        <TextInput
          ref={inputRef}
          value={tag.label}
          onChange={(e) => setTag({ ...tag, label: e.target.value })}
          className="bg-base-200"
        />
      </div>

      <div className="flex justify-end items-center mt-5">
        <Button variant="accent" onClick={submit} disabled={!tag.label.trim()}>
          {t("create_new_tag")}
        </Button>
      </div>
    </Modal>
  );
}
