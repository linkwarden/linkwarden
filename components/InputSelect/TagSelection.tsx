// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import useTagStore from "@/store/tags";
import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { Options } from "./types";

type Props = {
  onChange: any;
  defaultValue?: {
    value: number;
    label: string;
  }[];
};

export default function ({ onChange, defaultValue }: Props) {
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
      defaultValue={defaultValue}
      menuPosition="fixed"
      isMulti
    />
  );
}
