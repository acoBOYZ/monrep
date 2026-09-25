import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@monrep/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "my-3 shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

interface TextSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  text: string;
}

export function TextSeparator({ text, className, ...props }: TextSeparatorProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} {...props}>
      <Separator className="flex-1" />
      <span className="text-xs whitespace-nowrap text-cool">{text}</span>
      <Separator className="flex-1" />
    </div>
  );
}

interface ComponentSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ComponentSeparator({ children, className, ...props }: ComponentSeparatorProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} {...props}>
      <Separator className="flex-1" />
      <span className="text-md whitespace-nowrap text-muted-foreground/75">{children}</span>
      <Separator className="flex-1" />
    </div>
  );
}
