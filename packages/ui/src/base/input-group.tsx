import { cn } from "@monrep/utils";
import { Input } from "./input";
import type { ComponentPropsWithRef } from "react";
import type { InputProps } from "./input";

export function InputGroup({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("flex h-9 w-full min-w-0 items-center", className)}
      {...props}
    />
  );
}

export function InputGroupAddon({ className, ...props }: ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn("inline-flex shrink-0 items-center text-muted-foreground", className)}
      {...props}
    />
  );
}

export function InputGroupInput({ className, ...props }: InputProps) {
  return (
    <Input
      data-slot="input-group-input"
      className={cn(
        "h-full min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
