import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@monrep/ui/base";
import type { ReactNode } from "react";

type ChartExpandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  description?: string;
  children: ReactNode;
};

export function ChartExpandDialog({
  open,
  onOpenChange,
  heading,
  description,
  children,
}: ChartExpandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
