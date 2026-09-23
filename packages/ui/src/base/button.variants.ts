import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "focus:not(:focus-visible):outline-none inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-normal whitespace-nowrap transition-transform duration-75 ease-out outline-none focus:outline-none focus-visible:outline-none active:translate-x-px active:translate-y-px disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:translate-x-0 aria-disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive disabled:[&_span]:cursor-not-allowed disabled:[&_span]:opacity-90 aria-disabled:[&_span]:cursor-not-allowed aria-disabled:[&_span]:opacity-30 disabled:[&_svg]:cursor-not-allowed disabled:[&_svg]:opacity-90 aria-disabled:[&_svg]:cursor-not-allowed aria-disabled:[&_svg]:opacity-30",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        success: "border border-background bg-success text-white shadow-xs hover:bg-success/70",
        warning: "border border-background bg-warning text-white shadow-xs hover:bg-warning/70",
        destructive:
          "border border-background bg-destructive text-white shadow-xs hover:bg-destructive/70",
        great: "border border-background bg-great text-white shadow-xs hover:bg-great/70",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline active:translate-x-0 active:translate-y-0",
        empty: "text-primary",
      },
      size: {
        default: "h-9 px-3 py-1 has-[>svg]:px-2",
        xs: "h-6 gap-1 rounded-md px-3 has-[>svg]:px-2",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2",
        lg: "h-10 rounded-md px-3 has-[>svg]:px-2",
        icon: "size-9",
        iconxs: "h-8 w-fit px-1",
        xl: "h-16 rounded-md px-3 has-[>svg]:px-2",
        small: "h-9 py-1",
      },
      text: {
        default: "font-semibold",
        bold: "font-black",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      text: "default",
    },
  },
);
