// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { Options } from "./types";

type Props = {
  onChange: any;
  defaultValue:
    | {
        value: number;
        label: string;
      }
    | undefined;
};

export default function ({ onChange, defaultValue }: Props) {
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
    <CreatableSelect
      isClearable
      onChange={onChange}
      options={options}
      styles={styles}
      defaultValue={defaultValue}
      menuPosition="fixed"
    />
  );
}
