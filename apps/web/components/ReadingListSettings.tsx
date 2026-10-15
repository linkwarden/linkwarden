import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useUpdateUser, useUser } from "@linkwarden/router/user";
import { useCollections } from "@linkwarden/router/collections";
import TagSelection from "@/components/InputSelect/TagSelection";
import { styles } from "@/components/InputSelect/styles";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CollectionOption = { value: number; label: string };

const sameItems = <T,>(a: T[], b: T[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

export default function ReadingListSettings() {
  const { t } = useTranslation();
  const { data: account } = useUser() as any;
  const { data: collections = [] } = useCollections();
  const updateUser = useUpdateUser();

  const [collectionIds, setCollectionIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [submitLoader, setSubmitLoader] = useState(false);

  useEffect(() => {
    if (!account?.id) return;
    setCollectionIds(account.readingListCollections ?? []);
    setTags(account.readingListTags ?? []);
  }, [account]);

  const hasChanges =
    !!account?.id &&
    (!sameItems(collectionIds, account.readingListCollections ?? []) ||
      !sameItems(tags, account.readingListTags ?? []));

  const collectionOptions: CollectionOption[] = collections.map(
    (collection) => ({
      value: collection.id as number,
      label: collection.name,
    })
  );

  const save = async () => {
    if (!hasChanges) return;

    setSubmitLoader(true);
    const load = toast.loading(t("applying_settings"));

    try {
      await updateUser.mutateAsync({
        id: account.id,
        username: account.username,
        email: account.email,
        // updateUserById clears the avatar when the image is left out.
        image: account.image,
        readingListCollections: collectionIds,
        readingListTags: tags,
      });
      toast.success(t("settings_applied"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitLoader(false);
      toast.dismiss(load);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <i className="bi-bookmark text-primary text-2xl"></i>
        <p className="capitalize text-3xl font-thin inline">
          {t("reading_list")}
        </p>
      </div>

      <Separator className="my-3" />

      <p className="text-neutral text-sm mb-3">{t("reading_list_rule_desc")}</p>

      <p className="mb-2">{t("collections")}</p>
      <Select
        isMulti
        className="react-select-container text-sm"
        classNamePrefix="react-select"
        styles={styles}
        placeholder={t("select_collections")}
        options={collectionOptions}
        value={collectionOptions.filter((option) =>
          collectionIds.includes(option.value)
        )}
        onChange={(selected: MultiValue<CollectionOption>) =>
          setCollectionIds(selected.map((option) => option.value))
        }
      />

      <p className="mt-3 mb-2">{t("tags")}</p>
      {account?.id && (
        <TagSelection
          key={account.id}
          onChange={(selected: { label: string }[]) =>
            setTags(selected.map((option) => option.label))
          }
          defaultValue={(account.readingListTags ?? []).map(
            (label: string) => ({ label })
          )}
        />
      )}

      <Button
        onClick={save}
        disabled={submitLoader || !hasChanges}
        className="mt-3 w-full sm:w-fit"
        variant="primary"
      >
        {t("save_changes")}
      </Button>
    </div>
  );
}
