import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { InputActionMeta } from "react-select";
import { styles } from "./styles";
import { ArchivalTagOption, Option } from "@linkwarden/types/inputSelect";
import { useTags } from "@linkwarden/router/tags";
import { useTranslation } from "next-i18next";
import { TagSort } from "@linkwarden/types/global";

type Props = {
  onChange: (e: any) => void;
  options?: Option[] | ArchivalTagOption[];
  isArchivalSelection?: boolean;
  defaultValue?: {
    value?: number;
    label: string;
  }[];
  autoFocus?: boolean;
  onBlur?: any;
};

export default function TagSelection({
  onChange,
  options,
  isArchivalSelection,
  defaultValue,
  autoFocus,
  onBlur,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: tags = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTags(undefined, {
    sort: TagSort.NameAZ,
    search: searchQuery,
  });
  const { t } = useTranslation();

  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  useEffect(() => {
    const formatedCollections = tags.map((e: any) => {
      return { value: e.id, label: e.name };
    });

    setTagOptions(formatedCollections);
  }, [tags]);

  return (
    <CreatableSelect
      isClearable={false}
      className="react-select-container text-sm"
      classNamePrefix="react-select"
      onChange={onChange}
      options={isArchivalSelection ? options : tagOptions}
      styles={styles}
      value={isArchivalSelection ? [] : undefined}
      defaultValue={isArchivalSelection ? undefined : defaultValue}
      placeholder={t("tag_selection_placeholder")}
      isMulti
      autoFocus={autoFocus}
      onBlur={onBlur}
      isLoading={isFetchingNextPage}
      onInputChange={(value: string, { action }: InputActionMeta) => {
        if (action === "input-change") setSearchQuery(value);
        else if (
          action === "input-blur" ||
          action === "menu-close" ||
          action === "set-value"
        )
          setSearchQuery("");
      }}
      onMenuScrollToBottom={() => {
        if (!hasNextPage || isFetchingNextPage) return;
        fetchNextPage();
      }}
    />
  );
}
