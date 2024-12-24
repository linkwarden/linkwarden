import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { styles } from "./styles";
import { Options } from "./types";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { useCollections } from "@/hooks/store/collections";
import clsx from "clsx";

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
      return {
        value: e.id,
        label: e.name,
        ownerId: e.ownerId,
        count: e._count,
        parentId: e.parentId,
      };
    });

    setOptions(formatedCollections);
  }, [collections]);

  const getParentNames = (parentId: number): string[] => {
    const parentNames = [];
    const parent = collections.find((e) => e.id === parentId);

    if (parent) {
      parentNames.push(parent.name);
      if (parent.parentId) {
        parentNames.push(...getParentNames(parent.parentId));
      }
    }

    // Have the top level parent at beginning
    return parentNames.reverse();
  };

  const customOption = ({ data, innerProps }: any) => {
    return (
      <div
        {...innerProps}
        className="px-2 py-2 last:border-0 border-b border-neutral-content hover:bg-neutral-content duration-100 cursor-pointer"
      >
        <div className="flex w-full justify-between items-center">
          <span>{data.label}</span>
          <span className="text-sm text-neutral">{data.count?.links}</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {getParentNames(data?.parentId).length > 0 ? (
            <>
              {getParentNames(data.parentId).join(" > ")} {">"} {data.label}
            </>
          ) : (
            data.label
          )}
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
        }}
        // menuPosition="fixed"
      />
    );
  }
}
