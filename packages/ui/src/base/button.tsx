import { Children, cloneElement } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@monrep/utils";
import { buttonVariants } from "./button.variants";
import type { ComponentPropsWithRef, ReactElement } from "react";
import type { VariantProps } from "class-variance-authority";

export type ButtonProps = ComponentPropsWithRef<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, text, ...props }: ButtonProps) => {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ className, variant, size, text }))}
      {...props}
    />
  );
};

export interface ButtonGroupProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
  children: Array<ReactElement<ButtonProps>>;
}

export const ButtonGroup = ({
  className,
  orientation = "horizontal",
  children,
}: ButtonGroupProps) => {
  const totalButtons = Children.count(children);
  const isHorizontal = orientation === "horizontal";
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex",
        {
          "flex-col": isVertical,
          "w-fit": isVertical,
        },
        className,
      )}
    >
      {Children.map(children, (child, index) => {
        const isFirst = index === 0;
        const isLast = index === totalButtons - 1;

        return cloneElement(child, {
          className: cn(
            {
              "rounded-s-none": isHorizontal && !isFirst,
              "rounded-e-none": isHorizontal && !isLast,
              "border-s-0": isHorizontal && !isFirst,

              "rounded-t-none": isVertical && !isFirst,
              "rounded-b-none": isVertical && !isLast,
              "border-t-0": isVertical && !isFirst,
            },
            child.props.className,
          ),
        });
      })}
    </div>
  );
};
