import useCollectionSlice from "@/store/collection";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { Options } from "./types";

export default function ({ onChange }: any) {
  const { collections } = useCollectionSlice();
  const router = useRouter();

  const [options, setOptions] = useState<Options[]>([]);

  const collectionId = Number(router.query.id);

  const activeCollection = collections.find((e) => {
    return e.id === collectionId;
  });

  let defaultCollection = null;

  if (activeCollection) {
    defaultCollection = {
      value: activeCollection?.id,
      label: activeCollection?.name,
    };
  }

  useEffect(() => {
    const formatedCollections = collections.map((e) => {
      return { value: e.id, label: e.name };
    });

    setOptions(formatedCollections);
  }, [collections]);

  return (
    <CreatableSelect
      isClearable
      onChange={onChange}
      options={options}
      styles={styles}
      defaultValue={defaultCollection}
      menuPosition="fixed"
    />
  );
}
