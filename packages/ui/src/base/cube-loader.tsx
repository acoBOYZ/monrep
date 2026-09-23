import { useCallback } from "react";
import { cn } from "@monrep/utils";
import type { Ref } from "react";

const CUBE_DELAYS = [90, 180, 270, 0, 90, 180, 90, 180, 270];
const CUBE_ANIMATION_DURATION_MS = 650;

function setRef<Element>(ref: Ref<Element> | undefined, value: Element | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function setCubeAnimationPhase(svg: SVGSVGElement | null, ref?: Ref<SVGSVGElement>) {
  if (svg && typeof window !== "undefined") {
    svg.style.setProperty(
      "--an-cube-loader-phase",
      `${window.performance.now() % CUBE_ANIMATION_DURATION_MS}ms`,
    );
  }
  setRef(ref, svg);
}

function resolveCubeLoaderAttrs({ size, width, height, title, stroke, ...props }: CubeLoaderProps) {
  const hasRole = Object.prototype.hasOwnProperty.call(props, "role");
  const isAriaHidden = props["aria-hidden"] === true || props["aria-hidden"] === "true";
  const hasExplicitSize = size !== undefined || width !== undefined || height !== undefined;
  const ariaLabel =
    props["aria-label"] ?? title ?? (hasRole || isAriaHidden ? undefined : "Loading");
  const role = hasRole ? props.role : isAriaHidden ? undefined : "status";
  const strokeColor = stroke === undefined ? undefined : String(stroke);

  return {
    hasExplicitSize,
    ariaLabel,
    role,
    strokeColor,
  };
}

export type CubeLoaderProps = Omit<React.SVGProps<SVGSVGElement>, "children" | "stroke"> & {
  absoluteStrokeWidth?: boolean;
  size?: number | string;
  stroke?: string | number;
  title?: string;
};

export function CubeLoader({
  absoluteStrokeWidth,
  className,
  size,
  stroke,
  title,
  width,
  height,
  ref,
  ...props
}: CubeLoaderProps) {
  const { hasExplicitSize, ariaLabel, role, strokeColor } = resolveCubeLoaderAttrs({
    size,
    width,
    height,
    title,
    stroke,
    ...props,
  });
  const setRefs = useCallback(
    (svg: SVGSVGElement | null) => setCubeAnimationPhase(svg, ref),
    [ref],
  );

  return (
    <svg
      {...props}
      ref={setRefs}
      role={role}
      aria-label={ariaLabel}
      width={width ?? size ?? 24}
      height={height ?? size ?? 24}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke={strokeColor}
      vectorEffect={absoluteStrokeWidth ? "non-scaling-stroke" : props.vectorEffect}
      className={cn(!hasExplicitSize && "size-4", className)}
      data-agent-native-cube-loader="true"
    >
      {title ? <title>{title}</title> : null}
      {CUBE_DELAYS.map((delay, index) => (
        <rect
          key={index}
          // "animate-cube-pulse" from "animate.css"
          className="an-cube-cell"
          x={2.5 + (index % 3) * 7}
          y={2.5 + Math.floor(index / 3) * 7}
          width={5}
          height={5}
          rx={1}
          style={{
            animationDelay: `calc(${delay}ms - var(--an-cube-loader-phase, 0ms))`,
          }}
        />
      ))}
    </svg>
  );
}
