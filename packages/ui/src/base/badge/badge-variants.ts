import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-lg border px-1.5 text-xs leading-normal font-medium whitespace-nowrap transition-[box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        muted: "border-transparent bg-muted text-muted-foreground [a&]:hover:bg-muted/90",
        accent: "border-transparent bg-accent text-accent-foreground [a&]:hover:bg-accent/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        warning:
          "border-transparent bg-warning text-white focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/90",
        success:
          "border-transparent bg-success text-white focus-visible:ring-success/20 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/90",
        great:
          "border-transparent bg-great text-white focus-visible:ring-great/20 [a&]:hover:bg-great/90",
        cool: "border-transparent bg-cool text-primary-foreground focus-visible:ring-cool/20 [a&]:hover:bg-cool/90",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      size: {
        default: "px-2.5 py-0 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      disabled: {
        true: "pointer-events-none cursor-not-allowed opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      disabled: false,
    },
  },
);
