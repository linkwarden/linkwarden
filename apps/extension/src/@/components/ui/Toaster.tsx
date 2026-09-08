import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../ui/Toast";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "../../../hooks/useToast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {variant === "success" && (
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
