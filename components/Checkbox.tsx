import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEventHandler } from "react";

type Props = {
  label: string;
  state: boolean;
  className?: string;
  onClick: ChangeEventHandler<HTMLInputElement>;
};

export default function Checkbox({ label, state, className, onClick }: Props) {
  return (
    <label
      className={`cursor-pointer flex items-center gap-2 text-sky-700 ${className}`}
    >
      <input
        type="checkbox"
        checked={state}
        onChange={onClick}
        className="peer sr-only"
      />
      <FontAwesomeIcon
        icon={faSquareCheck}
        className="w-5 h-5 text-sky-700 peer-checked:block hidden"
      />
      <FontAwesomeIcon
        icon={faSquare}
        className="w-5 h-5 text-sky-700 peer-checked:hidden block"
      />
      <span className="text-sky-900 rounded select-none">{label}</span>
    </label>
  );
}
