import { cn } from "@monrep/utils";
import { widgetVariants } from "./widget.variants";
import type { HTMLAttributes, Ref } from "react";
import type { VariantProps } from "class-variance-authority";

interface WidgetProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof widgetVariants> {
  ref?: Ref<HTMLDivElement>;
}

export const Widget = ({ className, size, design, variant, ...props }: WidgetProps) => (
  <div className={cn(widgetVariants({ size, design, variant, className }))} {...props} />
);

interface WidgetHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export const WidgetHeader = ({ className, ...props }: WidgetHeaderProps) => (
  <div
    className={cn("text-semibold flex flex-none items-start justify-between", className)}
    {...props}
  />
);

interface WidgetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLHeadingElement>;
}

export const WidgetTitle = ({ className, children, ...props }: WidgetTitleProps) => (
  <h5 className={cn("leading-none font-semibold tracking-tight", className)} {...props}>
    {children}
  </h5>
);

interface WidgetContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export const WidgetContent = ({ className, ...props }: WidgetContentProps) => (
  <div className={cn("flex flex-1 items-center justify-center", className)} {...props} />
);

interface WidgetFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export const WidgetFooter = ({ className, ...props }: WidgetFooterProps) => (
  <div className={cn("flex flex-none items-center justify-between", className)} {...props} />
);
