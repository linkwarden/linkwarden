import React, { forwardRef } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@linkwarden/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-slate-500",
        primary: "bg-primary text-primary-foreground",
        accent: "bg-violet-600 border border-violet-400",
        destructive: "bg-destructive",
        outline: "border",
        secondary: "bg-secondary text-secondary-foreground",
        metal: "bg-neutral-content text-base-content border border-neutral/30",
        ghost: "",
        simple: "bg-base-200",
        link: "text-primary underline-offset-",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-11 px-8",
        full: "w-full px-4 py-2",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = TouchableOpacityProps &
  VariantProps<typeof buttonVariants> & {
    /**
     * Render this instead of children when loading.
     * Disables the button while true.
     */
    isLoading?: boolean;
    /** Optional icon element, placed before the text */
    icon?: React.ReactNode;
    /** Contents of the button */
    children: React.ReactNode;
    /** Merge additional Tailwind classes */
    className?: string;
  };

export const Button = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      variant = "default",
      size,
      className,
      isLoading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const combinedClasses = cn(buttonVariants({ variant, size }), className);

    return (
      <TouchableOpacity
        ref={ref}
        className={combinedClasses}
        activeOpacity={0.8}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <View className="flex-row items-center">
            {icon && <View className="mr-2">{icon}</View>}
            <Text
              className={cn(
                "text-sm font-medium",
                variant === "default" ||
                  variant === "accent" ||
                  variant === "destructive"
                  ? "text-white"
                  : "text-black"
              )}
            >
              {children}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";
