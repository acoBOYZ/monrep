import { cn } from "@monrep/utils";
import { FRAME_CLASS, FRAME_INSET } from "./frame";
import type { ReactNode } from "react";

type ContentFrameProps = {
  children: ReactNode;
  className?: string;
  inset?: boolean;
};

export function ContentFrame({ children, className, inset = true }: ContentFrameProps) {
  return <div className={cn(FRAME_CLASS, inset && FRAME_INSET, className)}>{children}</div>;
}
