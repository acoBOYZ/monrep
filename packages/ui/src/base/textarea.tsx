import { cn } from "@monrep/utils";
import type { ComponentPropsWithRef } from "react";

export const Textarea = ({ className, ...props }: ComponentPropsWithRef<"textarea">) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
};
