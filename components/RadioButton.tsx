import { ChangeEventHandler } from "react";

type Props = {
  label: string;
  state: boolean;
  onClick: ChangeEventHandler<HTMLInputElement>;
};

export default function RadioButton({ label, state, onClick }: Props) {
  return (
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="radio"
        value={label}
        className="peer sr-only"
        checked={state}
        onChange={onClick}
      />
      <span className="rounded select-none">{label}</span>
    </label>
  );
}
