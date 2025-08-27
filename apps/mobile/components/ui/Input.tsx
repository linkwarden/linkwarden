import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { cn } from "@linkwarden/lib/utils";

const Input = forwardRef<TextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          "bg-base-200 text-base-content rounded-lg px-4 py-2",
          className
        )}
        {...props}
      />
    );
  }
);

export default Input;
