import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { ArchivalTagOption, Option } from "./types";
import { useTags } from "@/hooks/store/tags";
import { useTranslation } from "next-i18next";

type Props = {
  onChange: (e: any) => void;
  options?: Option[] | ArchivalTagOption[];
  isArchivalTagSelection?: boolean;
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
  isArchivalTagSelection,
  defaultValue,
  autoFocus,
  onBlur,
}: Props) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags();
  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  useEffect(() => {
    setTagOptions(
      tags.map((e: any) => ({
        value: e.id,
        label: e.name,
      }))
    );
  }, [tags]);

  const selectOptions =
    isArchivalTagSelection && options ? options : tagOptions;
  const selectValue = isArchivalTagSelection ? [] : defaultValue;

  return (
    <CreatableSelect
      isClearable={false}
      className="react-select-container"
      classNamePrefix="react-select"
      onChange={onChange}
      options={selectOptions}
      styles={styles}
      value={selectValue}
      placeholder={t("tag_selection_placeholder")}
      isMulti
      autoFocus={autoFocus}
      onBlur={onBlur}
    />
  );
}
