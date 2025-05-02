import clsx from "clsx";
import { ChangeEventHandler } from "react";

type Props = {
  label: string;
  className?: string;
  state: boolean;
  onClick: ChangeEventHandler<HTMLInputElement>;
};

export default function RadioButton({
  label,
  state,
  onClick,
  className,
}: Props) {
  return (
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="radio"
        value={label}
        className={clsx("peer sr-only", className)}
        checked={state}
        onChange={onClick}
      />
      <span className="rounded select-none">{label}</span>
    </label>
  );
}
