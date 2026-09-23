import { Dialog as DialogPrimitive } from "@base-ui/react";
import { cn } from "@monrep/utils";
import { XIcon } from "lucide-react";
import { Button } from "./button";
import type { ComponentProps, ComponentPropsWithRef } from "react";

/* -------------------------------------------------------------------------- */
/* Root / Trigger / Close                                                     */
/* -------------------------------------------------------------------------- */

export const Dialog = (props: ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);

export const DialogTrigger = (props: ComponentPropsWithRef<typeof DialogPrimitive.Trigger>) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

export const DialogClose = (props: ComponentPropsWithRef<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

/* -------------------------------------------------------------------------- */
/* Portal / Backdrop / Viewport / Popup                                       */
/* -------------------------------------------------------------------------- */

export const DialogPortal = (props: ComponentProps<typeof DialogPrimitive.Portal>) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
);

export const DialogBackdrop = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Backdrop>) => (
  <DialogPrimitive.Backdrop
    data-slot="dialog-backdrop"
    className={cn(
      "fixed inset-0 z-60 bg-muted/54 ease-out will-change-[opacity] data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0 data-open:animate-in data-open:duration-200 data-open:fade-in-0",
      className,
    )}
    {...props}
  />
);

export const DialogContent = ({
  className,
  children,
  showCloseButton = true,
  backdropClassName,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Popup> & {
  showCloseButton?: boolean;
  backdropClassName?: string;
}) => (
  <DialogPortal>
    <DialogBackdrop className={backdropClassName} />
    <DialogPrimitive.Viewport className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "relative z-60 grid w-full max-w-lg origin-center transform-gpu gap-4 rounded-lg rounded-tr-2xl border bg-background p-3 shadow-lg ease-out will-change-[opacity,transform] backface-hidden data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:duration-200 data-open:fade-in-0 data-open:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogClose
            className={cn(
              "group/dialog absolute top-1.25 right-1.25 cursor-pointer focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              "rounded-xl border bg-background text-foreground shadow-lg transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-cool",
            )}
            render={
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "pointer-events-auto absolute z-60 flex touch-manipulation items-center justify-center",
                  "size-7 md:size-9",
                )}
              >
                <XIcon className="size-4 transition-transform duration-150 group-hover/dialog:rotate-90 group-hover/dialog:stroke-3 md:size-5" />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Viewport>
  </DialogPortal>
);

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

export const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-header"
    className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
    {...props}
  />
);

export const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);

/* -------------------------------------------------------------------------- */
/* Title / Description                                                        */
/* -------------------------------------------------------------------------- */

export const DialogTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);
