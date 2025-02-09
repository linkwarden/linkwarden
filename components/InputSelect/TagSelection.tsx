import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { ArchivalTagOption, Option } from "./types";
import { useTags } from "@/hooks/store/tags";
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
  const { data: tags = [] } = useTags();
  const { t } = useTranslation();

  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  useEffect(() => {
    const formatedCollections = tags.map((e: any) => {
      return { value: e.id, label: e.name };
    });

    setTagOptions(formatedCollections);
  }, [tags]);

  return (
    <>
      {isArchivalSelection ? (
        <CreatableSelect
          isClearable={false}
          className="react-select-container"
          classNamePrefix="react-select"
          onChange={onChange}
          options={options}
          styles={styles}
          value={[]}
          placeholder={t("tag_selection_placeholder")}
          isMulti
          autoFocus={autoFocus}
          onBlur={onBlur}
        />
      ) : (
        <CreatableSelect
          isClearable={false}
          className="react-select-container"
          classNamePrefix="react-select"
          onChange={onChange}
          options={tagOptions}
          styles={styles}
          defaultValue={defaultValue}
          placeholder={t("tag_selection_placeholder")}
          isMulti
          autoFocus={autoFocus}
          onBlur={onBlur}
        />
      )}
    </>
  );
}
