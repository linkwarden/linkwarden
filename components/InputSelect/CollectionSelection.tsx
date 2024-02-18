import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { styles } from "./styles";
import { Options } from "./types";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";

type Props = {
  onChange: any;
  showDefaultValue?: boolean;
  defaultValue?:
    | {
        label: string;
        value?: number;
      }
    | undefined;
  creatable?: boolean;
};

export default function CollectionSelection({
  onChange,
  defaultValue,
  showDefaultValue = true,
  creatable = true,
}: Props) {
  const { collections } = useCollectionStore();
  const router = useRouter();

  const [options, setOptions] = useState<Options[]>([]);

  const collectionId = Number(router.query.id);

  const activeCollection = collections.find((e) => {
    return e.id === collectionId;
  });

  if (activeCollection && !defaultValue) {
    defaultValue = {
      value: activeCollection?.id,
      label: activeCollection?.name,
    };
  }

  useEffect(() => {
    const formatedCollections = collections.map((e) => {
      return { value: e.id, label: e.name, ownerId: e.ownerId };
    });

    setOptions(formatedCollections);
  }, [collections]);

  if (creatable) {
    return (
      <CreatableSelect
        isClearable={false}
        className="react-select-container"
        classNamePrefix="react-select"
        onChange={onChange}
        options={options}
        styles={styles}
        defaultValue={showDefaultValue ? defaultValue : null}
        // menuPosition="fixed"
      />
    );
  } else {
    return (
      <Select
        isClearable={false}
        className="react-select-container"
        classNamePrefix="react-select"
        onChange={onChange}
        options={options}
        styles={styles}
        defaultValue={showDefaultValue ? defaultValue : null}
        // menuPosition="fixed"
      />
    );
  }
}
