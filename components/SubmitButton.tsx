import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-regular-svg-icons";
import { MouseEventHandler } from "react";

type Props = {
  onClick: Function;
  icon: IconDefinition;
  label: string;
  className?: string;
};

export default function SubmitButton({
  onClick,
  icon,
  label,
  className,
}: Props) {
  return (
    <div
      className={`bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md text-lg tracking-wide select-none font-semibold cursor-pointer duration-100 hover:bg-sky-400 w-fit ${className}`}
      onClick={onClick as MouseEventHandler<HTMLDivElement>}
    >
      <FontAwesomeIcon icon={icon} className="h-5" />
      {label}
    </div>
  );
}
