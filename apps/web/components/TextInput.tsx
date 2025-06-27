import React, {
  forwardRef,
  ChangeEventHandler,
  KeyboardEventHandler,
} from "react";

type Props = {
  autoFocus?: boolean;
  value?: string;
  type?: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  className?: string;
  spellCheck?: boolean;
  "data-testid"?: string;
};

const TextInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      autoFocus,
      value,
      type,
      placeholder,
      onChange,
      onKeyDown,
      className,
      spellCheck,
      "data-testid": dataTestId,
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        data-testid={dataTestId}
        spellCheck={spellCheck}
        autoFocus={autoFocus}
        type={type ?? "text"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`
          w-full rounded-md p-2
          border-neutral-content border-solid border
          outline-none focus:border-primary duration-100
          ${className ?? ""}
        `}
      />
    );
  }
);

// Give it a display name for easier debugging
TextInput.displayName = "TextInput";

export default TextInput;
