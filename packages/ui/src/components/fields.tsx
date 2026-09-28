import { cn } from "@monrep/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type FieldListProps = HTMLAttributes<HTMLDivElement>;

export const FieldList = ({ className, ...props }: FieldListProps) => {
  return <div className={cn("flex flex-col divide-y divide-border/50", className)} {...props} />;
};

export type FieldRowLayout = "stacked" | "grid";

export type FieldRowProps = {
  layout?: FieldRowLayout;
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  endAdornment?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const FieldRow = ({
  layout = "grid",
  label,
  description,
  children,
  endAdornment,
  className,
  ...props
}: FieldRowProps) => {
  return (
    <div className={cn("py-3 first:pt-0 last:pb-0", className)} {...props}>
      <div
        className={cn(
          "gap-3",
          layout === "stacked" && "flex justify-between",
          layout === "grid" && "grid sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start sm:gap-6",
        )}
      >
        {/* Label / Description */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description ? (
            <p className="text-xs tracking-tighter text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:max-w-md">{children}</div>

          {endAdornment ? (
            <div className="flex shrink-0 flex-col gap-2 sm:text-right">{endAdornment}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
