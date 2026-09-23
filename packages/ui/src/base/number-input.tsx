import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import type { Ref } from "react";
import type { NumericFormatProps } from "react-number-format";

export interface NumberInputProps extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  ref?: Ref<HTMLInputElement>;
  value?: number;
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
}

export const NumberInput = ({
  ref,
  stepper,
  thousandSeparator,
  placeholder,
  defaultValue,
  min = -Infinity,
  max = Infinity,
  onValueChange,
  fixedDecimalScale = false,
  decimalScale = 0,
  suffix,
  prefix,
  value: controlledValue,
  ...props
}: NumberInputProps) => {
  const isControlled = controlledValue !== undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = useState<number | undefined>(defaultValue);
  const value = isControlled ? controlledValue : uncontrolled;

  useImperativeHandle(ref, () => inputRef.current!, []);

  const stepValue = useCallback(
    (direction: 1 | -1) => {
      const step = stepper ?? 1;
      const next =
        value === undefined
          ? direction * step
          : direction === 1
            ? Math.min(value + step, max)
            : Math.max(value - step, min);
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    [stepper, max, min, value, isControlled, onValueChange],
  );

  const handleIncrement = useCallback(() => stepValue(1), [stepValue]);
  const handleDecrement = useCallback(() => stepValue(-1), [stepValue]);

  useHotkey(
    "ArrowUp",
    (event) => {
      event.preventDefault();
      handleIncrement();
    },
    {
      target: inputRef,
      ignoreInputs: false,
    },
  );

  useHotkey(
    "ArrowDown",
    (event) => {
      event.preventDefault();
      handleDecrement();
    },
    {
      target: inputRef,
      ignoreInputs: false,
    },
  );

  const commitNumericInputValue = (values: { value: string; floatValue: number | undefined }) => {
    const newValue = values.floatValue === undefined ? undefined : values.floatValue;
    if (!isControlled) setUncontrolled(newValue);
    onValueChange?.(newValue);
  };

  const clampNumericInputToBounds = () => {
    if (!inputRef.current || value === undefined) return;

    if (value < min) {
      if (!isControlled) setUncontrolled(min);
      onValueChange?.(min);
      inputRef.current.value = String(min);
    } else if (value > max) {
      if (!isControlled) setUncontrolled(max);
      onValueChange?.(max);
      inputRef.current.value = String(max);
    }
  };

  return (
    <div className="flex items-center">
      <NumericFormat
        getInputRef={inputRef}
        value={value}
        onValueChange={commitNumericInputValue}
        thousandSeparator={thousandSeparator}
        decimalScale={decimalScale}
        fixedDecimalScale={fixedDecimalScale}
        allowNegative={min < 0}
        valueIsNumericString
        onBlur={clampNumericInputToBounds}
        max={max}
        min={min}
        suffix={suffix}
        prefix={prefix}
        customInput={Input}
        placeholder={placeholder}
        className="relative [appearance:textfield] rounded-r-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...props}
      />

      <div className="flex flex-col">
        <Button
          aria-label="Increase value"
          className="h-4.5 rounded-l-none rounded-br-none border-b-[0.5px] border-l-0 border-input px-2 focus-visible:relative"
          variant="outline"
          onClick={handleIncrement}
          disabled={value === max}
        >
          <ChevronUp size={15} />
        </Button>
        <Button
          aria-label="Decrease value"
          className="h-4.5 rounded-l-none rounded-tr-none border-t-[0.5px] border-l-0 border-input px-2 focus-visible:relative"
          variant="outline"
          onClick={handleDecrement}
          disabled={value === min}
        >
          <ChevronDown size={15} />
        </Button>
      </div>
    </div>
  );
};
