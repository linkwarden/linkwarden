import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Select from "react-select";
import { styles } from "./styles";
import { Options } from "./types";

type Props = {
  onChange: any;
  defaultValue:
    | {
        label: string;
        value?: number;
      }
    | undefined;
};

export default function CollectionSelection({ onChange, defaultValue }: Props) {
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

  return (
    <Select
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
      onChange={onChange}
      options={options}
      styles={styles}
      defaultValue={defaultValue}
      // menuPosition="fixed"
    />
  );
}
