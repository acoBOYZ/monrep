import { Children, createContext, isValidElement, use } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight, Circle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import type { ComponentProps, ComponentPropsWithRef } from "react";

const dropdownMenuPopupClassName = cn(
  "z-100 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
);

export function DropdownMenu(props: ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuPortal(props: ComponentProps<typeof MenuPrimitive.Portal>) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export const DropdownMenuTrigger = ({
  ref,
  asChild,
  children,
  nativeButton,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.Trigger> & { asChild?: boolean }) => {
  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      return (
        <MenuPrimitive.Trigger
          ref={ref}
          data-slot="dropdown-menu-trigger"
          render={child}
          nativeButton={nativeButton ?? true}
          {...props}
        />
      );
    }
  }

  return (
    <MenuPrimitive.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props}>
      {children}
    </MenuPrimitive.Trigger>
  );
};

type DropdownMenuPositionerProps = Pick<
  ComponentProps<typeof MenuPrimitive.Positioner>,
  | "align"
  | "alignOffset"
  | "side"
  | "sideOffset"
  | "collisionAvoidance"
  | "collisionBoundary"
  | "collisionPadding"
>;

type DropdownMenuContentProps = ComponentPropsWithRef<typeof MenuPrimitive.Popup> &
  DropdownMenuPositionerProps & {
    /** Radix compat — prevents focus returning to the trigger on close. */
    onCloseAutoFocus?: (event: Event) => void;
    /** Radix compat — when `false`, disables collision avoidance. */
    avoidCollisions?: boolean;
    /** Extra classes for the floating positioner (z-index, stacking). */
    positionerClassName?: string;
  };

export const DropdownMenuContent = ({
  ref,
  className,
  align,
  alignOffset,
  side,
  sideOffset = 4,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  onCloseAutoFocus,
  avoidCollisions,
  finalFocus,
  positionerClassName,
  ...props
}: DropdownMenuContentProps) => {
  const resolvedCollisionAvoidance =
    collisionAvoidance ??
    (avoidCollisions === false ? ({ side: "none", align: "none" } as const) : undefined);
  const resolvedFinalFocus = finalFocus ?? (onCloseAutoFocus ? false : undefined);

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className={cn("isolate z-60 outline-none", positionerClassName)}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={resolvedCollisionAvoidance}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
      >
        <MenuPrimitive.Popup
          ref={ref}
          data-slot="dropdown-menu-content"
          className={cn(dropdownMenuPopupClassName, className)}
          finalFocus={resolvedFinalFocus}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
};

const DropdownMenuGroupContext = createContext(false);

export const DropdownMenuGroup = ({
  children,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.Group>) => (
  <DropdownMenuGroupContext value={true}>
    <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}>
      {children}
    </MenuPrimitive.Group>
  </DropdownMenuGroupContext>
);

type DropdownMenuItemProps = Omit<ComponentPropsWithRef<typeof MenuPrimitive.Item>, "onClick"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  asChild?: boolean;
  onSelect?: (event: Event) => void;
  onClick?: ComponentProps<typeof MenuPrimitive.Item>["onClick"];
};

export const DropdownMenuItem = ({
  ref,
  className,
  inset,
  variant = "default",
  asChild,
  children,
  onSelect,
  onClick,
  closeOnClick,
  ...props
}: DropdownMenuItemProps) => {
  const itemClassName = cn(
    "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 data-[variant=destructive]:text-destructive! data-[variant=destructive]:focus:bg-destructive/5 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
    className,
  );

  const handleClickAndSelect: NonNullable<ComponentProps<typeof MenuPrimitive.Item>["onClick"]> = (
    event,
  ) => {
    onSelect?.(event.nativeEvent);
    onClick?.(event);
  };

  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      return (
        <MenuPrimitive.Item
          ref={ref}
          data-slot="dropdown-menu-item"
          data-inset={inset}
          data-variant={variant}
          className={itemClassName}
          render={child}
          onClick={handleClickAndSelect}
          closeOnClick={closeOnClick}
          {...props}
        />
      );
    }
  }

  return (
    <MenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={itemClassName}
      onClick={handleClickAndSelect}
      closeOnClick={closeOnClick}
      {...props}
    >
      {children}
    </MenuPrimitive.Item>
  );
};

export const DropdownMenuCheckboxItem = ({
  ref,
  className,
  children,
  checked,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.CheckboxItem>) => (
  <MenuPrimitive.CheckboxItem
    ref={ref}
    data-slot="dropdown-menu-checkbox-item"
    className={cn(
      "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <MenuPrimitive.CheckboxItemIndicator>
        <HugeiconsIcon icon={Check} className="size-4" aria-hidden />
      </MenuPrimitive.CheckboxItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
);

export const DropdownMenuRadioGroup = (
  props: ComponentPropsWithRef<typeof MenuPrimitive.RadioGroup>,
) => <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;

export const DropdownMenuRadioItem = ({
  ref,
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.RadioItem>) => (
  <MenuPrimitive.RadioItem
    ref={ref}
    data-slot="dropdown-menu-radio-item"
    className={cn(
      "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <MenuPrimitive.RadioItemIndicator>
        <HugeiconsIcon icon={Circle} className="size-2 fill-current" aria-hidden />
      </MenuPrimitive.RadioItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
);

export const DropdownMenuLabel = ({
  ref,
  className,
  inset,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.GroupLabel> & {
  inset?: boolean;
}) => {
  const inGroup = use(DropdownMenuGroupContext);

  const label = (
    <MenuPrimitive.GroupLabel
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium data-inset:pl-8", className)}
      {...props}
    />
  );

  if (inGroup) {
    return label;
  }

  return <MenuPrimitive.Group>{label}</MenuPrimitive.Group>;
};

export const DropdownMenuSeparator = ({
  ref,
  className,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.Separator>) => (
  <MenuPrimitive.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
);

export const DropdownMenuShortcut = ({
  ref,
  className,
  ...props
}: ComponentPropsWithRef<"span">) => (
  <span
    ref={ref}
    data-slot="dropdown-menu-shortcut"
    className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
    {...props}
  />
);

export function DropdownMenuSub(props: ComponentProps<typeof MenuPrimitive.SubmenuRoot>) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

export const DropdownMenuSubTrigger = ({
  ref,
  className,
  inset,
  children,
  ...props
}: ComponentPropsWithRef<typeof MenuPrimitive.SubmenuTrigger> & {
  inset?: boolean;
}) => (
  <MenuPrimitive.SubmenuTrigger
    ref={ref}
    data-slot="dropdown-menu-sub-trigger"
    data-inset={inset}
    className={cn(
      "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-8 data-open:bg-accent data-open:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground",
      className,
    )}
    {...props}
  >
    {children}
    <HugeiconsIcon icon={ChevronRight} className="ml-auto size-4" aria-hidden />
  </MenuPrimitive.SubmenuTrigger>
);

export const DropdownMenuSubContent = ({
  className,
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  ...props
}: DropdownMenuContentProps) => (
  <DropdownMenuContent
    data-slot="dropdown-menu-sub-content"
    className={cn("overflow-hidden shadow-lg", className)}
    align={align}
    alignOffset={alignOffset}
    side={side}
    sideOffset={sideOffset}
    {...props}
  />
);
