import { ChangeEventHandler } from "react";

type Props = {
  label: string;
  state: boolean;
  className?: string;
  onClick: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

export default function Checkbox({
  label,
  state,
  className,
  onClick,
  disabled,
}: Props) {
  return (
    <label
      className={`label cursor-pointer flex gap-2 justify-start ${
        className || ""
      }`}
      aria-disabled={disabled}
    >
      <input
        type="checkbox"
        checked={state}
        onChange={onClick}
        className="checkbox checkbox-primary"
        disabled={disabled}
      />
      <span className="label-text">{label}</span>
    </label>
  );
}
