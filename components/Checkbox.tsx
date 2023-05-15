import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEventHandler } from "react";

type Props = {
  label: string;
  state: boolean;
  onClick: ChangeEventHandler<HTMLInputElement>;
};

export default function Checkbox({ label, state, onClick }: Props) {
  return (
    <label className="cursor-pointer flex items-center gap-2 text-sky-500">
      <input
        type="checkbox"
        checked={state}
        onChange={onClick}
        className="peer sr-only"
      />
      <FontAwesomeIcon
        icon={faSquareCheck}
        className="w-5 h-5 text-sky-500 peer-checked:block hidden"
      />
      <FontAwesomeIcon
        icon={faSquare}
        className="w-5 h-5 text-sky-500 peer-checked:hidden block"
      />
      <span className="text-sky-900 rounded select-none">{label}</span>
    </label>
  );
}
