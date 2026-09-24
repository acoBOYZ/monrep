import { toast as sonnerToast } from "sonner";
import { CustomToast } from "./toaster";
import type { CustomToastProps } from "./toaster";

export function customToast({ children, ...props }: CustomToastProps) {
  return sonnerToast.custom(
    (id) => (
      <div className="group overflow-clip">
        <CustomToast
          id={id}
          title={props.title}
          content={props.content}
          buttons={props.buttons}
          dismissible={props.dismissible}
        >
          {children}
        </CustomToast>
      </div>
    ),
    {
      id: props.id,
      duration: props.dismissible === false ? Infinity : props.duration,
    },
  );
}
