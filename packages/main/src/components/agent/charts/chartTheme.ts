import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleUtc } from "d3-scale";

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const CHART_PALETTE_CLASS =
  "[--ts-chart-1:var(--color-primary)] [--ts-chart-2:var(--color-success)] [--ts-chart-3:var(--color-warning)] [--ts-chart-4:var(--color-destructive)] [--ts-chart-5:var(--color-cool)] [--ts-chart-6:var(--color-muted-foreground)] [--ts-chart-tooltip-background:var(--color-popover)] [--ts-chart-tooltip-color:var(--color-popover-foreground)] [--ts-chart-tooltip-border:1px_solid_var(--color-border)] [--ts-chart-tooltip-border-radius:0.5rem]";

export const CHART_MOTION = {
  svgAnimation: { duration: 280, easing: "ease-out" },
  clip: true,
} as const;

export function SERIES_COLOR(index: number): string {
  return `var(--ts-chart-${(index % 6) + 1})`;
}

export function timeAxis(from: number, to: number) {
  return {
    scale: () => scaleUtc().domain([new Date(from), new Date(to)]),
    grid: false,
    axis: {
      ticks: {
        count: 6,
        format: (d: Date) => timeFormat.format(d),
      },
      line: false,
    },
  };
}

export function valueAxis(label: string, domain?: [number, number]) {
  return {
    scale: domain ? () => scaleLinear().domain(domain) : scaleLinear,
    nice: domain === undefined,
    grid: true,
    axis: {
      ticks: { count: 4 },
      label: { text: label },
    },
  };
}
