import { icons } from "@/lib/client/icons";
import React, { useMemo, useState } from "react";
import Fuse from "fuse.js";
import TextInput from "./TextInput";

const fuse = new Fuse(icons, {
  keys: [{ name: "name", weight: 4 }, "tags", "categories"],
  threshold: 0.2,
  useExtendedSearch: true,
});

type Props = {};

const IconPicker = (props: Props) => {
  const [query, setQuery] = useState("");

  const filteredQueryResultsSelector = useMemo(() => {
    if (!query) {
      return icons;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query]);

  return (
    <div className="w-fit">
      <TextInput
        className="p-2 rounded w-full mb-5"
        placeholder="Search icons"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid grid-cols-6 gap-5 w-fit">
        {filteredQueryResultsSelector.map((icon) => {
          const IconComponent = icon.Icon;
          return (
            <div key={icon.name} onClick={() => console.log(icon.name)}>
              <IconComponent size={32} weight="fill" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
