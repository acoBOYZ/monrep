import { Checkbox as CheckboxPrimitive } from "@base-ui/react";
import { cn } from "@monrep/utils";
import { Check } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

export const Checkbox = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof CheckboxPrimitive.Root>) => {
  const disabled = props.disabled === true;

  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer flex size-4 shrink-0 cursor-pointer rounded-sm border border-primary shadow",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out motion-reduce:transition-none",
        "active:scale-95",

        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",

        "disabled:cursor-not-allowed disabled:active:scale-100",
        "disabled:border-muted-foreground/35 disabled:bg-muted/45 disabled:text-muted-foreground",

        disabled &&
          "border-muted-foreground/35 bg-muted/45 text-muted-foreground data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground",

        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current transition-[opacity,transform] duration-150 ease-out data-[state=checked]:scale-100 data-[state=checked]:opacity-100 data-[state=unchecked]:scale-75 data-[state=unchecked]:opacity-0 motion-reduce:transition-none [&>svg]:transition-[stroke-dashoffset,transform,opacity] [&>svg]:duration-200 [&>svg]:ease-out [&>svg]:[stroke-dasharray:24] data-[state=checked]:[&>svg]:scale-100 data-[state=checked]:[&>svg]:[stroke-dashoffset:0] data-[state=unchecked]:[&>svg]:scale-90 data-[state=unchecked]:[&>svg]:[stroke-dashoffset:24] motion-reduce:[&>svg]:transition-none">
        <Check className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
