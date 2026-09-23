import { cn } from "@monrep/utils";
import { Circle } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

type LabelProps = Omit<ComponentPropsWithRef<"label">, "htmlFor"> & {
  htmlFor?: string;
};

export const Label = ({ className, htmlFor, ...props }: LabelProps) => (
  <label
    data-slot="label"
    htmlFor={htmlFor}
    className={cn(
      "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      className,
    )}
    {...props}
  />
);

type RequiredLabelProps = ComponentPropsWithRef<typeof Label> & {
  required?: boolean;
  destructive?: boolean;
};

export const RequiredLabel = ({
  className,
  required,
  destructive,
  children,
  ...props
}: RequiredLabelProps) => {
  return (
    <Label
      className={cn("inline-flex items-center gap-1", destructive && "text-destructive", className)}
      {...props}
    >
      {children}

      {required && <Circle className="size-1.5 fill-current text-destructive" aria-hidden="true" />}
    </Label>
  );
};
