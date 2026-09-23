import { createContext, use, useEffect, useState } from "react";
import { cn } from "@monrep/utils";
import { SearchIcon } from "lucide-react";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "./combobox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { InputGroup, InputGroupAddon } from "./input-group";
import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef, ReactNode, Ref } from "react";
import type { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

type InputBind = {
  value?: string;
  onValueChange?: (value: string) => void;
};
type InputBindSetter = (next: InputBind) => void;

const CommandInputBindContext = createContext<InputBindSetter | null>(null);

type StringComboboxProps = ComboboxPrimitive.Root.Props<string>;

export type CommandProps = {
  className?: string;
  children?: ReactNode;
  shouldFilter?: boolean;
  filter?: StringComboboxProps["filter"];
  inline?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onItemHighlighted?: StringComboboxProps["onItemHighlighted"];
  onValueChange?: StringComboboxProps["onValueChange"];
  onInputValueChange?: StringComboboxProps["onInputValueChange"];
};

export function Command({
  className,
  shouldFilter = true,
  inline = true,
  open = true,
  onOpenChange,
  filter,
  onItemHighlighted,
  onValueChange,
  onInputValueChange,
  children,
}: CommandProps) {
  const [inputBind, setInputBind] = useState<InputBind>({});
  const [uncontrolledInput, setUncontrolledInput] = useState("");
  const inputValue = inputBind.value ?? uncontrolledInput;

  return (
    <div
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className,
      )}
    >
      <CommandInputBindContext value={setInputBind}>
        <Combobox<string>
          inline={inline}
          open={open}
          onOpenChange={(nextOpen, eventDetails) => {
            // Item press must not close the dialog — CommandItem onSelect owns that.
            if (!nextOpen && eventDetails.reason === "item-press") {
              eventDetails.cancel();
              return;
            }
            onOpenChange?.(nextOpen);
          }}
          filter={filter ?? (shouldFilter ? undefined : null)}
          autoHighlight="always"
          onItemHighlighted={onItemHighlighted}
          inputValue={inputValue}
          value={null}
          onValueChange={onValueChange}
          onInputValueChange={(next, eventDetails) => {
            if (eventDetails.isItemPress) {
              eventDetails.cancel();
              return;
            }
            inputBind.onValueChange?.(next);
            if (inputBind.value === undefined) setUncontrolledInput(next);
            onInputValueChange?.(next, eventDetails);
          }}
        >
          {children}
        </Combobox>
      </CommandInputBindContext>
    </div>
  );
}

export type CommandDialogProps = Omit<ComponentPropsWithoutRef<typeof Dialog>, "onOpenChange"> & {
  ref?: Ref<ComponentRef<typeof DialogContent>>;
  title?: string;
  description?: string;
  shouldFilter?: boolean;
  showCloseButton?: boolean;
  className?: string;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  onItemHighlighted?: StringComboboxProps["onItemHighlighted"];
};

export const CommandDialog = ({
  ref,
  title = "Command Palette",
  description = "Search for a command to run...",
  shouldFilter = true,
  showCloseButton = true,
  children,
  className,
  open,
  onOpenChange,
  onItemHighlighted,
  ...props
}: CommandDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange} {...props}>
    <DialogHeader className="sr-only">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogContent
      ref={ref}
      showCloseButton={showCloseButton}
      className={cn("overflow-hidden p-0", className)}
    >
      <Command
        shouldFilter={shouldFilter}
        open={open ?? true}
        onOpenChange={onOpenChange}
        onItemHighlighted={onItemHighlighted}
        className="**:data-[slot=combobox-group]:px-2 **:data-[slot=combobox-group-label]:px-2 **:data-[slot=combobox-group-label]:font-medium **:data-[slot=combobox-group-label]:text-muted-foreground **:data-[slot=combobox-input]:h-9 **:data-[slot=combobox-item]:px-2 **:data-[slot=combobox-item]:py-2 **:data-[slot=command-input-wrapper]:h-10"
      >
        {children}
      </Command>
    </DialogContent>
  </Dialog>
);

type CommandInputProps = Omit<ComponentProps<typeof ComboboxInput>, "onChange" | "value"> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

export const CommandInput = ({ className, value, onValueChange, ...props }: CommandInputProps) => {
  const bindInput = use(CommandInputBindContext);

  useEffect(() => {
    if (!bindInput) return;
    bindInput({ value, onValueChange });
    return () => bindInput({});
  }, [bindInput, onValueChange, value]);

  return (
    <InputGroup data-slot="command-input-wrapper" className="h-9 gap-2 border-b px-3">
      <InputGroupAddon>
        <SearchIcon className="size-4 shrink-0 opacity-50" />
      </InputGroupAddon>
      <ComboboxInput
        data-slot="command-input"
        className={cn("h-10 flex-1 py-3", className)}
        {...props}
      />
    </InputGroup>
  );
};

export const CommandList = ({ className, ...props }: ComponentProps<typeof ComboboxList>) => (
  <ComboboxList data-slot="command-list" className={className} {...props} />
);

export const CommandEmpty = (props: ComponentProps<typeof ComboboxEmpty>) => (
  <ComboboxEmpty data-slot="command-empty" {...props} />
);

type CommandGroupProps = ComponentProps<typeof ComboboxGroup> & {
  heading?: ReactNode;
};

export const CommandGroup = ({ heading, className, children, ...props }: CommandGroupProps) => (
  <ComboboxGroup data-slot="command-group" className={className} {...props}>
    {heading ? <ComboboxGroupLabel>{heading}</ComboboxGroupLabel> : null}
    {children}
  </ComboboxGroup>
);

export const CommandSeparator = ({
  className,
  ...props
}: ComponentProps<typeof ComboboxSeparator>) => (
  <ComboboxSeparator data-slot="command-separator" className={className} {...props} />
);

type CommandItemProps = Omit<ComponentProps<typeof ComboboxItem>, "value"> & {
  value?: string;
  onSelect?: (value: string) => void;
};

export const CommandItem = ({
  className,
  value,
  onSelect,
  disabled,
  onClick,
  ...props
}: CommandItemProps) => (
  <ComboboxItem
    data-slot="command-item"
    value={value}
    disabled={disabled}
    className={className}
    onClick={(event) => {
      onClick?.(event);
      if (value) onSelect?.(value);
    }}
    {...props}
  />
);

export const CommandShortcut = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    data-slot="command-shortcut"
    className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
    {...props}
  />
);
