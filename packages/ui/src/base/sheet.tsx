import { Children, isValidElement } from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@monrep/utils";
import { XIcon } from "lucide-react";
import type { ComponentProps, ComponentPropsWithRef } from "react";

export const Sheet = (props: ComponentProps<typeof SheetPrimitive.Root>) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
);

export const SheetTrigger = ({
  asChild,
  children,
  ...props
}: ComponentPropsWithRef<typeof SheetPrimitive.Trigger> & { asChild?: boolean }) => {
  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      return <SheetPrimitive.Trigger data-slot="sheet-trigger" render={child} {...props} />;
    }
  }

  return (
    <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props}>
      {children}
    </SheetPrimitive.Trigger>
  );
};

export const SheetClose = (props: ComponentPropsWithRef<typeof SheetPrimitive.Close>) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
);

export const SheetPortal = (props: ComponentProps<typeof SheetPrimitive.Portal>) => (
  <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
);

type OverlayPosition = "fixed" | "absolute";

export const SheetOverlay = ({
  className,
  position = "fixed",
  ...props
}: ComponentPropsWithRef<typeof SheetPrimitive.Backdrop> & {
  position?: OverlayPosition;
}) => (
  <SheetPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={cn(
      "data-closed:animate-out data-open:animate-in",
      "data-closed:fade-out-0 data-open:fade-in-0",
      position === "fixed" ? "fixed inset-0" : "absolute inset-0",
      "z-50 bg-black/50",
      className,
    )}
    {...props}
  />
);

type ContentSide = "top" | "right" | "bottom" | "left";

export const SheetContent = ({
  className,
  children,
  side = "right",
  withinPortal = true,
  container,
  position = "fixed",
  ...props
}: ComponentPropsWithRef<typeof SheetPrimitive.Popup> & {
  side?: ContentSide;
  /** If true (default), wrap content in a Portal */
  withinPortal?: boolean;
  /** Portal target; used only when withinPortal === true */
  container?: HTMLElement | null;
  /** Positioning mode; use "absolute" to scope inside a container */
  position?: OverlayPosition;
}) => {
  const ContentBody = (
    <>
      <SheetOverlay position={position} />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "z-60 flex flex-col gap-4 bg-background px-3 shadow-lg transition ease-in-out data-closed:animate-out data-closed:duration-150 data-open:animate-in data-open:duration-150",
          position === "fixed" ? "fixed" : "absolute",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-closed:slide-out-to-right data-open:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r data-closed:slide-out-to-left data-open:slide-in-from-left sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-closed:slide-out-to-top data-open:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-closed:slide-out-to-bottom data-open:slide-in-from-bottom",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 cursor-pointer rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none data-open:bg-secondary">
          <XIcon className="size-5 transition-transform hover:rotate-90" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </>
  );

  // Base UI requires Popup to be rendered inside Portal.
  if (!withinPortal) {
    return <SheetPortal>{ContentBody}</SheetPortal>;
  }

  return <SheetPortal container={container ?? undefined}>{ContentBody}</SheetPortal>;
};

export const SheetHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
);

export const SheetFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);

export const SheetTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("font-semibold text-foreground", className)}
    {...props}
  />
);

export const SheetDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);
