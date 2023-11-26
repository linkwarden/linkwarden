import { ChangeEventHandler, KeyboardEventHandler } from "react";

type Props = {
  autoFocus?: boolean;
  value?: string;
  type?: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement> | undefined;
  className?: string;
};

export default function TextInput({
  autoFocus,
  value,
  type,
  placeholder,
  onChange,
  onKeyDown,
  className,
}: Props) {
  return (
    <input
      autoFocus={autoFocus}
      type={type ? type : "text"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={`w-full rounded-md p-2 border-neutral-content border-solid border outline-none focus:border-primary duration-100 ${
        className || ""
      }`}
    />
  );
}
