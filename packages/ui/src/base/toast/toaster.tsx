import { useCallback } from "react";
import { X } from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
// import { useEnvStoreWithKey } from "@react/shell";
import type { ComponentProps, ReactNode } from "react";

export interface ToastButtonProps {
  id?: string | number;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface CustomToastProps {
  id: string | number;
  title: string;
  content?: ReactNode;
  buttons?: Array<ToastButtonProps>;
  dismissible?: boolean;
  children?: ReactNode;
  duration?: number;
}

export function CustomToast(props: CustomToastProps) {
  const { id, title, content, buttons = [], dismissible, children } = props;
  const handleDismiss = useCallback(() => {
    sonnerToast.dismiss(id);
  }, [id]);
  const handleButtonClick = useCallback(
    (button: ToastButtonProps) => () => {
      button.onClick();
      sonnerToast.dismiss(id);
    },
    [id],
  );

  return (
    <div className="relative flex flex-col gap-2 p-4">
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 cursor-pointer rounded-lg p-1 opacity-30 transition-opacity group-hover:opacity-100 hover:bg-muted-foreground/10"
          aria-label="Dismiss"
        >
          <X className="size-4 transition-transform hover:rotate-90" />
        </button>
      )}

      <div className="font-medium">{title}</div>

      {content && <div className="text-sm text-neutral-600">{content}</div>}

      {children}

      {buttons.length > 0 && (
        <div className="mt-2 flex gap-2">
          {buttons.map((button) => (
            <button
              key={button.id ?? `${button.label}-${button.primary ? "primary" : "secondary"}`}
              type="button"
              onClick={handleButtonClick(button)}
              className={
                button.primary
                  ? "rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
                  : "rounded-md bg-neutral-200 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-300"
              }
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // const theme = useEnvStoreWithKey("theme");

  return (
    <Sonner
      // theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:rounded-br-none group-[.toaster]:overflow-clip group-[.toaster]:w-[300px]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
