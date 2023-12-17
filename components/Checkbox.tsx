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
      className={`label cursor-pointer flex gap-2 justify-start ${
        className || ""
      }`}
    >
      <input
        type="checkbox"
        checked={state}
        onChange={onClick}
        className="checkbox checkbox-primary"
      />
      <span className="label-text">{label}</span>
    </label>
  );
}
