import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { ArchivalTagOption, Option } from "./types";
import { useTags } from "@/hooks/store/tags";
import { useTranslation } from "next-i18next";

type Props = {
  onChange: any;
  defaultValue?: {
    value?: number;
    label: string;
  }[];
  type?: "normal" | "archival";
  autoFocus?: boolean;
  onBlur?: any;
};

export default function TagSelection({
  onChange,
  defaultValue,
  type = "normal",
  autoFocus,
  onBlur,
}: Props) {
  const { data: tags = [] } = useTags();
  const { t } = useTranslation();

  const [options, setOptions] = useState<ArchivalTagOption[] | Option[]>([]);

  useEffect(() => {
    const formattedTags = tags.map((e: any) => {
      if (type === "archival") {
        return {
          value: e.id,
          label: e.name,
          archiveAsScreenshot: e.archiveAsScreenshot,
          archiveAsMonolith: e.archiveAsMonolith,
          archiveAsPDF: e.archiveAsPDF,
          archiveAsReadable: e.archiveAsReadable,
          archiveAsWaybackMachine: e.archiveAsWaybackMachine,
        };
      } else {
        return {
          value: e.id,
          label: e.name,
        };
      }
    });

    setOptions(formattedTags);
  }, [tags]);

  return (
    <CreatableSelect
      isClearable={false}
      className="react-select-container"
      classNamePrefix="react-select"
      onChange={onChange}
      options={options}
      styles={styles}
      defaultValue={defaultValue}
      value={type === "archival" && []}
      placeholder={t("tag_selection_placeholder")}
      isMulti
      autoFocus={autoFocus}
      onBlur={onBlur}
    />
  );
}
