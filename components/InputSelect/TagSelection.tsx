import useTagStore from "@/store/tags";
import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { Options } from "./types";

export default function ({ onChange }: any) {
  const { tags } = useTagStore();

  const [options, setOptions] = useState<Options[]>([]);

  useEffect(() => {
    const formatedCollections = tags.map((e) => {
      return { value: e.id, label: e.name };
    });

    setOptions(formatedCollections);
  }, [tags]);

  return (
    <CreatableSelect
      isClearable
      onChange={onChange}
      options={options}
      styles={styles}
      menuPosition="fixed"
      isMulti
    />
  );
}
