import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "relative inline-flex w-fit items-center justify-center border bg-background",
  {
    variants: {
      size: {
        xs: "h-7 rounded-sm p-0.5",
        default: "h-9 rounded-sm p-0.75",
        sm: "h-8 rounded-sm p-0.5",
        md: "h-9 rounded-sm p-0.75",
        lg: "h-10 rounded-md p-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const tabsListIndicatorVariants = cva(
  "pointer-events-none absolute top-0 bottom-0 my-auto rounded-sm bg-muted transition-[left,width] duration-300",
  {
    variants: {
      size: {
        xs: "h-4",
        default: "h-6",
        sm: "h-5",
        md: "h-6",
        lg: "h-7",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const tabsTriggerVariants = cva(
  "relative z-10 inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap text-foreground transition-all duration-300 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        xs: "gap-1 px-1 py-0.5 text-[11px]",
        default: "gap-1.5 px-2 py-1 text-sm",
        sm: "gap-1 px-1.5 py-0.5 text-xs",
        md: "gap-1.5 px-2 py-0.75 text-xs",
        lg: "gap-2 px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const tabsListUnderlineVariants = cva("flex items-center bg-transparent", {
  variants: {
    size: {
      xs: "gap-1.5",
      default: "gap-3",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export const tabsTriggerUnderlineVariants = cva(
  "relative z-10 inline-flex h-auto flex-none cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap text-cool text-foreground transition after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded after:bg-brand after:transition-transform hover:bg-accent hover:text-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-transparent data-active:text-brand data-active:shadow-none data-active:after:scale-x-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        xs: "gap-1 px-1.5 py-0.5 text-[11px]",
        default: "gap-2 px-2 py-1 text-sm",
        sm: "gap-1.5 px-2 py-0.5 text-xs",
        md: "gap-2 px-2.5 py-0.75 text-xs",
        lg: "gap-2.5 px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
