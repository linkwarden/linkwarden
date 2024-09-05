import { icons } from "@/lib/client/icons";
import Fuse from "fuse.js";
import { useMemo } from "react";

const fuse = new Fuse(icons, {
  keys: [{ name: "name", weight: 4 }, "tags", "categories"],
  threshold: 0.2,
  useExtendedSearch: true,
});

type Props = {
  query: string;
  color: string;
  weight: "light" | "regular" | "bold" | "fill" | "duotone" | "thin";
  iconName?: string;
  setIconName: Function;
};

const IconGrid = ({ query, color, weight, iconName, setIconName }: Props) => {
  const filteredQueryResultsSelector = useMemo(() => {
    if (!query) {
      return icons;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query]);

  return (
    <>
      {filteredQueryResultsSelector.map((icon) => {
        const IconComponent = icon.Icon;
        return (
          <div
            key={icon.pascal_name}
            onClick={() => setIconName(icon.pascal_name)}
            className={`cursor-pointer btn p-1 box-border bg-base-100 border-none w-full ${
              icon.pascal_name === iconName
                ? "outline outline-1 outline-primary"
                : ""
            }`}
          >
            <IconComponent size={32} weight={weight} color={color} />
          </div>
        );
      })}
    </>
  );
};

export default IconGrid;
