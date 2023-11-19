import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  name: string;
  value: number;
  icon: IconProp;
};

export default function dashboardItem({ name, value, icon }: Props) {
  return (
    <div className="flex gap-4 items-end">
      <div className="p-4 bg-sky-500 bg-opacity-20 dark:bg-opacity-10 rounded-xl select-none">
        <FontAwesomeIcon
          icon={icon}
          className="w-8 h-8 text-sky-500 dark:text-sky-500"
        />
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm tracking-wider">
          {name}
        </p>
        <p className="font-thin text-6xl text-sky-500 dark:text-sky-500 mt-2">
          {value}
        </p>
      </div>
    </div>
  );
}
