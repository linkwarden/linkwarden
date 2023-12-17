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
      {/*<FontAwesomeIcon*/}
      {/*  icon={faCircleCheck}*/}
      {/*  className="w-5 h-5 text-primary peer-checked:block hidden"*/}
      {/*/>*/}
      {/*<FontAwesomeIcon*/}
      {/*  icon={faCircle}*/}
      {/*  className="w-5 h-5 text-primary peer-checked:hidden block"*/}
      {/*/>*/}
      <span className="rounded select-none">{label}</span>
    </label>
  );
}
