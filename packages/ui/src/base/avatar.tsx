import { Avatar as AvatarPrimitive } from "@base-ui/react";
import { cn } from "@monrep/utils";
import type { ComponentProps } from "react";

export type AvatarShape = "circle" | "square";

export function Avatar({
  className,
  shape = "circle",
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root> & { shape?: AvatarShape }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden",
        shape === "square" ? "rounded-[25%]" : "rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  src,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={src}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  );
}
