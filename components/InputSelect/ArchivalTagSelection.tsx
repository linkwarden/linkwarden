import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { useTranslation } from "next-i18next";
import { ArchivalTagOption } from "./types";

type Props = {
  options: ArchivalTagOption[] | [];
  onChange: (e: any) => void;
};

export default function ArchivalTagSelection({ options, onChange }: Props) {
  const { t } = useTranslation();

  return (
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
    />
  );
}
