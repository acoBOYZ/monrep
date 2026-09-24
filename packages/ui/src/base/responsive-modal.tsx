import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { cva } from "class-variance-authority";
import type { ComponentProps, ComponentPropsWithRef, HTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";

const Modal = (props: ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root {...props} />
);

const ModalTrigger = (props: ComponentPropsWithRef<typeof DialogPrimitive.Trigger>) => (
  <DialogPrimitive.Trigger {...props} />
);

const ModalClose = (props: ComponentPropsWithRef<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close {...props} />
);

const ModalPortal = (props: ComponentProps<typeof DialogPrimitive.Portal>) => (
  <DialogPrimitive.Portal {...props} />
);

const ModalOverlay = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Backdrop>) => (
  <DialogPrimitive.Backdrop
    className={cn(
      "fixed inset-0 z-50 bg-background/80",
      "data-closed:animate-out data-open:animate-in",
      "data-closed:fade-out-0 data-open:fade-in-0",
      "ease-out data-closed:duration-150 data-open:duration-200",
      className,
    )}
    {...props}
  />
);

const ModalVariants = cva(
  cn(
    "fixed z-50 gap-4 overflow-y-auto bg-background p-6 shadow-lg",
    "data-closed:animate-out data-open:animate-in",
    "ease-out data-closed:duration-150 data-open:duration-200",
    "transform-gpu will-change-[opacity,transform] backface-hidden",
    "lg:top-[50%] lg:left-[50%] lg:w-full lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%]",
    "lg:border lg:data-closed:fade-out-0 lg:data-open:fade-in-0",
    "lg:rounded-xl lg:data-closed:zoom-out-95 lg:data-open:zoom-in-95",
    "lg:rounded-tr-2xl",
  ),
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 max-h-[80dvh] rounded-b-xl border-b max-lg:data-closed:slide-out-to-top max-lg:data-open:slide-in-from-top lg:h-fit",
        bottom:
          "inset-x-0 bottom-0 max-h-[80dvh] rounded-t-xl border-t max-lg:data-closed:slide-out-to-bottom max-lg:data-open:slide-in-from-bottom lg:h-fit",
        left: "inset-y-0 left-0 h-full w-3/4 rounded-r-xl border-r max-lg:data-closed:slide-out-to-left max-lg:data-open:slide-in-from-left sm:max-w-sm lg:h-fit",
        right:
          "inset-y-0 right-0 h-full w-3/4 rounded-l-xl border-l max-lg:data-closed:slide-out-to-right max-lg:data-open:slide-in-from-right sm:max-w-sm lg:h-fit",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
);

type ModalContentProps = ComponentPropsWithRef<typeof DialogPrimitive.Popup> &
  VariantProps<typeof ModalVariants> & {
    overlayClassName?: string;
    overlayProps?: ComponentProps<typeof DialogPrimitive.Backdrop>;
  };

const ModalContent = ({
  side = "bottom",
  className,
  children,
  overlayClassName,
  overlayProps,
  ...props
}: ModalContentProps) => {
  return (
    <ModalPortal>
      <ModalOverlay {...overlayProps} className={cn(overlayClassName, overlayProps?.className)} />
      <DialogPrimitive.Popup
        {...props}
        aria-describedby="responsive-modal-description"
        className={cn(ModalVariants({ side }), className)}
      >
        {children}

        <ModalClose
          className={cn(
            "absolute top-1.5 right-1.5",
            "pointer-events-auto absolute z-60 flex touch-manipulation items-center justify-center",
            "size-7 md:size-9",
            "rounded-xl border text-foreground shadow-lg transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-cool",
            "group/re-mo cursor-pointer",
          )}
        >
          <HugeiconsIcon
            icon={XIcon}
            className="size-4 transition-transform duration-150 group-hover/re-mo:rotate-90 group-hover/re-mo:stroke-3 md:size-5"
            aria-hidden
          />
          <span className="sr-only">Close</span>
        </ModalClose>
      </DialogPrimitive.Popup>
    </ModalPortal>
  );
};

const ModalHeader = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("flex flex-col space-y-2 text-center sm:text-left", props.className)}
  />
);

const ModalFooter = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", props.className)}
  />
);

const ModalTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
);

const ModalDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    id="responsive-modal-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
