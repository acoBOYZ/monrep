import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@monrep/utils";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

type SelectValueType<TValue, TMultiple extends boolean | undefined> = TMultiple extends true
  ? Array<TValue>
  : TValue;

export type SelectProps<TValue, TMultiple extends boolean | undefined = false> = Omit<
  SelectPrimitive.Root.Props<TValue, TMultiple>,
  "onValueChange"
> & {
  onValueChange?: (value: SelectValueType<TValue, TMultiple>) => void;
};

export function Select<TValue, TMultiple extends boolean | undefined = false>({
  modal = false,
  onValueChange,
  ...props
}: SelectProps<TValue, TMultiple>) {
  const handleValueChange = (
    value: SelectValueType<TValue, TMultiple> | null,
    _eventDetails: SelectPrimitive.Root.ChangeEventDetails,
  ) => {
    if (value == null) return;
    onValueChange?.(value);
  };

  return <SelectPrimitive.Root modal={modal} {...props} onValueChange={handleValueChange} />;
}

export const SelectGroup = ({ className, ...props }: SelectPrimitive.Group.Props) => (
  <SelectPrimitive.Group className={cn("scroll-my-1 p-1", className)} {...props} />
);

export const SelectValue = ({ className, ...props }: SelectPrimitive.Value.Props) => (
  <SelectPrimitive.Value
    className={cn("flex flex-1 text-left [&>span]:line-clamp-1", className)}
    {...props}
  />
);

export const SelectTrigger = ({ className, children, ...props }: SelectPrimitive.Trigger.Props) => (
  <SelectPrimitive.Trigger
    className={cn(
      "flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-popover px-3 py-2 text-sm whitespace-nowrap shadow-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      "data-placeholder:text-muted-foreground/50 data-placeholder:[&>span]:text-muted-foreground/50",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon
      render={<ChevronsUpDownIcon className="pointer-events-none size-4 opacity-50" />}
    />
  </SelectPrimitive.Trigger>
);

export const SelectScrollUpButton = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) => (
  <SelectPrimitive.ScrollUpArrow
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpArrow>
);

export const SelectScrollDownButton = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) => (
  <SelectPrimitive.ScrollDownArrow
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDownIcon />
  </SelectPrimitive.ScrollDownArrow>
);

type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;

export const SelectContent = ({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Positioner
      side={side}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      className="isolate z-100"
    >
      <SelectPrimitive.Popup
        data-slot="select-content"
        className={cn(
          "relative z-100 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:translate-y-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:-translate-x-1 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-1 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-1 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
        <SelectScrollDownButton />
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>
);

export const SelectLabel = ({ className, ...props }: SelectPrimitive.GroupLabel.Props) => (
  <SelectPrimitive.GroupLabel
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
);

export const SelectItem = ({
  className,
  children,
  label,
  ...props
}: SelectPrimitive.Item.Props) => (
  <SelectPrimitive.Item
    label={label}
    className={cn(
      "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator
      render={
        <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
          <CheckIcon className="size-4" />
        </span>
      }
    />
  </SelectPrimitive.Item>
);

export const SelectSeparator = ({ className, ...props }: SelectPrimitive.Separator.Props) => (
  <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
);
