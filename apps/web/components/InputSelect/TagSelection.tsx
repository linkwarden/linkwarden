import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { ArchivalTagOption, Option } from "@linkwarden/types/inputSelect";
import { useTags } from "@linkwarden/router/tags";
import { useTranslation } from "next-i18next";

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
  const { data: tagsData = { tags: [], total: 0 } } = useTags();
  const tags = tagsData.tags;
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
    />
  );
}
