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
      <div className="p-4 bg-secondary/30 rounded-xl select-none">
        <FontAwesomeIcon icon={icon} className="w-8 h-8 text-primary" />
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-neutral text-sm tracking-wider">{name}</p>
        <p className="font-thin text-6xl text-primary mt-2">{value}</p>
      </div>
    </div>
  );
}
