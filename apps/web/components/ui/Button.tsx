import { cn } from "@/lib/client/utils";

import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "select-none relative duration-200 rounded-lg text-center w-fit flex justify-center items-center gap-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        accent:
          "bg-accent text-white hover:bg-accent/80 border border-violet-400",
        primary: "bg-primary text-primary-content hover:bg-primary/80",
        secondary:
          "bg-neutral-content text-secondary-foreground hover:bg-neutral-content/80 border border-neutral/30",
        destructive:
          "bg-error text-white hover:bg-error/80 border border-neutral/60",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-content",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        small: "h-7 px-2",
        medium: "h-10 px-4 py-2",
        large: "h-12 px-7 py-2",
        full: "px-4 py-2 w-full",
        icon: "h-10 w-10",
      },
      loading: {
        true: "cursor-wait",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "medium",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button: React.FC<ButtonProps> = ({
  className,
  intent,
  size,
  children,
  disabled,
  loading = false,
  ...props
}) => (
  <button
    className={cn(buttonVariants({ intent, size, className }))}
    disabled={loading || disabled}
    {...props}
  >
    {children}
  </button>
);

export default Button;
