import { cn } from "@monrep/utils";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import { cva } from "class-variance-authority";
import { Slash } from "lucide-react";
import type { ComponentProps } from "react";
import type { Hotkey } from "@tanstack/react-hotkeys";
import type { VariantProps } from "class-variance-authority";

/* -------------------------------------------------------------------------------------------------
 * Kbd variants
 * ------------------------------------------------------------------------------------------------- */

const KBD_CAP_STYLES =
  "rounded-sm border border-border/70 bg-accent/50 text-foreground font-normal shadow-[inset_0_-1px_0_oklch(0_0_0/0.15)] dark:bg-accent/70";

const kbdVariants = cva(
  "inline-flex items-center justify-center font-sans leading-none whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        default: KBD_CAP_STYLES,
        outline: cn(KBD_CAP_STYLES, "bg-background/80 dark:bg-accent/30"),
        ghost: "rounded-sm border border-transparent bg-muted/50 text-muted-foreground",
        soft: cn(KBD_CAP_STYLES, "bg-muted/80 dark:bg-accent/50"),
        secondary: KBD_CAP_STYLES,
      },
      size: {
        md: "min-w-7 px-2 py-1 text-[0.875rem]",
        sm: "min-w-6 px-1.5 py-0.5 text-[0.8125rem]",
        xs: "min-w-5 px-1 py-0.25 text-[0.75rem]",
        xxs: "min-w-3.5 px-0.5 py-0 text-[0.625rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xs",
    },
  },
);

/* -------------------------------------------------------------------------------------------------
 * Kbd (single key)
 * ------------------------------------------------------------------------------------------------- */

export function Kbd({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd data-slot="kbd" className={cn(kbdVariants({ variant, size }), className)} {...props} />
  );
}

/* -------------------------------------------------------------------------------------------------
 * KbdGroup (type-safe hotkeys)
 * ------------------------------------------------------------------------------------------------- */

type KbdGroupProps = {
  hotkey: Hotkey | Array<Hotkey>;
  className?: string;
} & VariantProps<typeof kbdVariants>;

export function KbdGroup({ hotkey, variant, size, className }: KbdGroupProps) {
  const hotkeys = Array.isArray(hotkey) ? hotkey : [hotkey];

  return (
    <kbd
      data-slot="kbd-group"
      className={cn(
        kbdVariants({ variant, size }),
        "gap-1 px-1.5",
        "[&_svg]:size-3 [&_svg]:stroke-2",
        size === "xs" && "gap-0.5 [&_svg]:size-2.5",
        size === "sm" && "gap-1 [&_svg]:size-3",
        size === "md" && "gap-1.5 px-2 [&_svg]:size-3.5",
        className,
      )}
    >
      {hotkeys.map((v, i) => (
        <span key={v} className="inline-flex items-center gap-1 leading-none">
          {i > 0 ? <Slash className="size-2.5 opacity-60" /> : null}
          <span>{formatForDisplay(v)}</span>
        </span>
      ))}
    </kbd>
  );
}
