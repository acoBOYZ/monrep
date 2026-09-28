import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, TooltipTrigger } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import type { ComponentProps, ReactNode } from "react";

type DeleteTriggerButtonProps = { headerTitle?: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  "title"
>;

export function DeleteTriggerButton({ headerTitle, className, ...rest }: DeleteTriggerButtonProps) {
  const tooltip = typeof headerTitle === "string" ? headerTitle : "Delete";

  return (
    <TooltipTrigger content={tooltip}>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className={cn(className)}
        aria-label="Delete"
        {...rest}
      >
        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
      </Button>
    </TooltipTrigger>
  );
}
