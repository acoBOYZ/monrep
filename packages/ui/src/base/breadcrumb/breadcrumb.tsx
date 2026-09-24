import { ChevronRight, MoreHorizontal } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import type { ComponentProps } from "react";

export function Breadcrumb({ ...props }: ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("text-cool [&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <HugeiconsIcon icon={ChevronRight} className="size-3.5" aria-hidden />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  moreLabel = "More",
  className,
  ...props
}: ComponentProps<"span"> & { moreLabel?: string }) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <HugeiconsIcon icon={MoreHorizontal} className="size-4" aria-hidden />
      <span className="sr-only">{moreLabel}</span>
    </span>
  );
}
