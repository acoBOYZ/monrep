import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cn } from "@monrep/utils";
import type { ComponentProps } from "react";

type ComboboxRootProps<Value, Multiple extends boolean | undefined = false, Item = Value> = Omit<
  ComboboxPrimitive.Root.Props<Value, Multiple, Item>,
  "autoHighlight"
> & {
  autoHighlight?: boolean | "always";
};

export function Combobox<Value, Multiple extends boolean | undefined = false, Item = Value>(
  props: ComboboxRootProps<Value, Multiple, Item>,
) {
  const { autoHighlight, ...rest } = props;
  return (
    <ComboboxPrimitive.Root
      data-slot="combobox"
      {...rest}
      autoHighlight={autoHighlight as boolean | undefined}
    />
  );
}

export const ComboboxInput = ({ className, ...props }: ComboboxPrimitive.Input.Props) => (
  <ComboboxPrimitive.Input
    data-slot="combobox-input"
    className={cn(
      "flex h-9 w-full min-w-0 bg-transparent text-sm outline-hidden",
      "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
);

export const ComboboxList = ({ className, ...props }: ComboboxPrimitive.List.Props) => (
  <ComboboxPrimitive.List
    data-slot="combobox-list"
    className={cn(
      "max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto outline-hidden",
      className,
    )}
    {...props}
  />
);

export const ComboboxEmpty = ({ className, ...props }: ComboboxPrimitive.Empty.Props) => (
  <ComboboxPrimitive.Empty
    data-slot="combobox-empty"
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
);

export const ComboboxGroup = ({ className, ...props }: ComboboxPrimitive.Group.Props) => (
  <ComboboxPrimitive.Group
    data-slot="combobox-group"
    className={cn("overflow-hidden p-1 text-foreground", className)}
    {...props}
  />
);

export const ComboboxGroupLabel = ({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) => (
  <ComboboxPrimitive.GroupLabel
    data-slot="combobox-group-label"
    className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
);

export const ComboboxCollection = (props: ComboboxPrimitive.Collection.Props) => (
  <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
);

export const ComboboxItem = ({ className, ...props }: ComboboxPrimitive.Item.Props) => (
  <ComboboxPrimitive.Item
    data-slot="combobox-item"
    className={cn(
      "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
      className,
    )}
    {...props}
  />
);

export const ComboboxSeparator = ({ className, ...props }: ComboboxPrimitive.Separator.Props) => (
  <ComboboxPrimitive.Separator
    data-slot="combobox-separator"
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
);

export type ComboboxProps = ComponentProps<typeof Combobox>;
