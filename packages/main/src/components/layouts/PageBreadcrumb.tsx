import { Fragment } from "react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";

export type Crumb = {
  label: string;
  to: LinkProps["to"];
  params?: LinkProps["params"];
};

type PageBreadcrumbProps = {
  /** Ancestor pages, root first. */
  items: ReadonlyArray<Crumb>;
  /** Current page label; rendered as the trailing, non-link crumb. */
  current: string;
  className?: string;
};

/**
 * Compact navigation trail shown above a page title. On narrow screens it
 * collapses to a single "‹ Parent" back link.
 */
export function PageBreadcrumb({ items, current, className }: PageBreadcrumbProps) {
  const parentIndex = items.length - 1;

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap gap-1 text-xs sm:flex-wrap sm:gap-1.5">
        {items.map((item, index) => {
          const isParent = index === parentIndex;
          return (
            <Fragment key={`${item.to}-${item.label}`}>
              <BreadcrumbItem className={cn("min-w-0", !isParent && "hidden sm:inline-flex")}>
                <BreadcrumbLink
                  className="inline-flex min-w-0 items-center gap-1 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  render={<Link to={item.to} params={item.params} />}
                >
                  {isParent ? (
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      className="size-3.5 shrink-0 sm:hidden"
                      aria-hidden
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
            </Fragment>
          );
        })}
        <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
          <BreadcrumbPage className="truncate">{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
