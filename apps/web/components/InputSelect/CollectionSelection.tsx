import { useRouter } from "next/router";
import {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { styles } from "./styles";
import { Option } from "@linkwarden/types/inputSelect";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";
import CreatableSelect from "react-select/creatable";
import Select, { components, MenuListProps } from "react-select";
import { useCollections } from "@linkwarden/router/collections";
import clsx from "clsx";
import VirtualRows, { useVirtualRows } from "@/components/VirtualRows";

const DefaultMenuList = components.MenuList as ComponentType<
  MenuListProps<Option, false>
>;

// An option's height (name over its path) until rows are measured.
const ESTIMATED_OPTION_HEIGHT = 57;

// Renders only the options near the visible part of the menu, since it can
// list thousands of collections.
function VirtualMenuList(props: MenuListProps<Option, false>) {
  // react-select's own option elements, passed through untouched so a row that
  // stays mounted isn't rendered again (Children.toArray would clone them).
  const options = (
    Array.isArray(props.children) ? props.children : [props.children]
  ) as ReactElement[];

  const rows = useVirtualRows({
    count: options.length,
    getItemKey: (index) => options[index]?.key ?? index,
    estimateSize: () => ESTIMATED_OPTION_HEIGHT,
  });

  const renderRow = useCallback(
    (index: number) => (
      // Each option sits alone in its row, so it can't tell it's the last one
      // from :last-child.
      <div
        className={index === options.length - 1 ? "[&>*]:border-0" : undefined}
      >
        {options[index]}
      </div>
    ),
    [options]
  );

  return (
    <DefaultMenuList {...props}>
      <VirtualRows rows={rows} renderRow={renderRow} />
    </DefaultMenuList>
  );
}

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
  autoFocus?: boolean;
  onBlur?: any;
  className?: string;
};

export default function CollectionSelection({
  onChange,
  defaultValue,
  showDefaultValue = true,
  creatable = true,
  autoFocus,
  onBlur,
  className,
}: Props) {
  const { data: collections = [] } = useCollections();

  const router = useRouter();

  const [options, setOptions] = useState<Option[]>([]);

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

  // The names of a collection's parents, top level first. `visited` starts with
  // the collection itself, so a parent cycle stops before coming back round.
  const getParentNames = (
    collection: CollectionIncludingMembersAndLinkCount,
    collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>
  ): string[] => {
    const parentNames: string[] = [];
    const visited = new Set<number>([collection.id as number]);
    let parentId = collection.parentId;

    while (parentId && !visited.has(parentId)) {
      const parent = collectionsById.get(parentId);
      if (!parent) break;

      visited.add(parentId);
      parentNames.unshift(parent.name);
      parentId = parent.parentId;
    }

    return parentNames;
  };

  useEffect(() => {
    // A map rather than find, which is quadratic over thousands of collections
    const collectionsById = new Map(
      collections.map((e) => [e.id as number, e])
    );

    const formattedCollections = collections
      .map((e) => {
        return {
          value: e.id,
          label: e.name,
          parentsLabel: [...getParentNames(e, collectionsById), e.name].join(
            " > "
          ),
          ownerId: e.ownerId,
          count: e._count,
          parentId: e.parentId,
        };
      })
      .sort((a, b) => {
        return a.parentsLabel.localeCompare(b.parentsLabel);
      });

    setOptions(formattedCollections);
  }, [collections]);

  const customOption = ({ data, innerProps }: any) => {
    return (
      <div
        {...innerProps}
        className="px-2 py-2 border-b border-neutral-content hover:bg-neutral-content duration-100 cursor-pointer"
      >
        <div className="flex w-full justify-between items-center">
          <span>{data.label}</span>
          <span className="text-sm text-neutral">{data.count?.links}</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {data.parentsLabel}
        </div>
      </div>
    );
  };

  if (creatable) {
    return (
      <CreatableSelect
        isClearable={false}
        className={clsx("react-select-container", className)}
        classNamePrefix="react-select"
        onChange={onChange}
        options={options}
        styles={styles}
        autoFocus={autoFocus}
        onBlur={onBlur}
        defaultValue={showDefaultValue ? defaultValue : null}
        components={{
          Option: customOption,
          MenuList: VirtualMenuList,
        }}
        // menuPosition="fixed"
      />
    );
  } else {
    return (
      <Select
        isClearable={false}
        className={clsx("react-select-container", className)}
        classNamePrefix="react-select"
        onChange={onChange}
        options={options}
        styles={styles}
        autoFocus={autoFocus}
        defaultValue={showDefaultValue ? defaultValue : null}
        onBlur={onBlur}
        components={{
          Option: customOption,
          MenuList: VirtualMenuList,
        }}
        // menuPosition="fixed"
      />
    );
  }
}
