import { icons } from "@/lib/client/icons";
import Fuse from "fuse.js";
import { forwardRef, useMemo } from "react";
import { FixedSizeGrid as Grid } from "react-window";

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
  const filteredIcons = useMemo(() => {
    if (!query) {
      return icons;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query]);

  const columnCount = 6;
  const rowCount = Math.ceil(filteredIcons.length / columnCount);
  const GUTTER_SIZE = 5;

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= filteredIcons.length) return null; // Prevent overflow

    const icon = filteredIcons[index];
    const IconComponent = icon.Icon;

    return (
      <div
        style={{
          ...style,
          left: style.left + GUTTER_SIZE,
          top: style.top + GUTTER_SIZE,
          width: style.width - GUTTER_SIZE,
          height: style.height - GUTTER_SIZE,
        }}
        onClick={() => setIconName(icon.pascal_name)}
        className={`cursor-pointer p-[6px] rounded-lg bg-base-100 w-full ${
          icon.pascal_name === iconName
            ? "outline outline-1 outline-primary"
            : ""
        }`}
      >
        <IconComponent size={32} weight={weight} color={color} />
      </div>
    );
  };

  const InnerElementType = forwardRef(({ style, ...rest }: any, ref) => (
    <div
      ref={ref}
      style={{
        ...style,
        paddingLeft: GUTTER_SIZE,
        paddingTop: GUTTER_SIZE,
      }}
      {...rest}
    />
  ));

  InnerElementType.displayName = "InnerElementType";

  return (
    <Grid
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={50}
      rowHeight={50}
      innerElementType={InnerElementType}
      width={320}
      height={158}
      itemData={filteredIcons}
      className="hide-scrollbar ml-[4px] w-fit"
    >
      {Cell}
    </Grid>
  );
};

export default IconGrid;
