import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import TextInput from "@/components/TextInput";
import { Collection } from "@linkwarden/prisma/client";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types";
import { useTranslation } from "next-i18next";
import { useCreateCollection } from "@linkwarden/router/collections";
import toast from "react-hot-toast";
import IconPicker from "../IconPicker";
import { IconWeight } from "@phosphor-icons/react";
import oklchVariableToHex from "@/lib/client/oklchVariableToHex";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type Props = {
  parent?: CollectionIncludingMembersAndLinkCount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export default function NewCollectionModal({
  parent,
  open,
  onOpenChange,
  children,
}: Props) {
  const { t } = useTranslation();

  const initial = {
    parentId: parent?.id,
    name: "",
    description: "",
    color: oklchVariableToHex("--p"), // Use resolved color
  } as Partial<Collection>;

  const [collection, setCollection] = useState<Partial<Collection>>(initial);

  useEffect(() => {
    setCollection(initial);
  }, [parent]);

  const [submitLoader, setSubmitLoader] = useState(false);

  const createCollection = useCreateCollection();

  const submit = async () => {
    if (submitLoader) return;
    if (!collection) return null;

    setSubmitLoader(true);

    const load = toast.loading(t("creating"));

    await createCollection.mutateAsync(collection, {
      onSettled: (data, error) => {
        setSubmitLoader(false);
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          onOpenChange(false);
          toast.success(t("created"));
        }
      },
    });
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {parent?.id ? (
            <>
              <DialogTitle className="text-xl font-thin">
                {t("new_sub_collection")}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t("for_collection", { name: parent.name })}
              </DialogDescription>
            </>
          ) : (
            <DialogTitle className="text-xl font-thin">
              {t("create_new_collection")}
            </DialogTitle>
          )}
        </DialogHeader>

        <Separator className="my-3" />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-end">
              <IconPicker
                color={collection.color || oklchVariableToHex("--p")}
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
                  ref={inputRef}
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

          <Button
            variant="accent"
            className="ml-auto"
            onClick={submit}
            aria-label={t("create_collection_button")}
          >
            {t("create_collection_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
