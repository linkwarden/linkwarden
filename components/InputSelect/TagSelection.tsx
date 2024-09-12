import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { Options } from "./types";
import { useTags } from "@/hooks/store/tags";

type Props = {
  onChange: any;
  defaultValue?: {
    value: number;
    label: string;
  }[];
  autoFocus?: boolean;
  onBlur?: any;
};

export default function TagSelection({
  onChange,
  defaultValue,
  autoFocus,
  onBlur,
}: Props) {
  const { data: tags = [] } = useTags();

  const [options, setOptions] = useState<Options[]>([]);

  useEffect(() => {
    const formatedCollections = tags.map((e: any) => {
      return { value: e.id, label: e.name };
    });

    setOptions(formatedCollections);
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
      isMulti
      autoFocus={autoFocus}
      onBlur={onBlur}
    />
  );
}
