import { encode } from "uqr";
import type { ReactNode } from "react";

type TotpQrProps = {
  otpauth: string;
  className?: string;
};

/** Tiny SVG QR from otpauth URI (no network). */
export function TotpQr({ otpauth, className }: TotpQrProps) {
  const { size, data } = encode(otpauth, { ecc: "M" });
  const cells: Array<ReactNode> = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!data[y]![x]) continue;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className ?? "size-44 rounded-xl bg-white p-2 text-black"}
      shapeRendering="crispEdges"
      aria-label="Authenticator QR code"
    >
      <rect width={size} height={size} fill="white" />
      <g fill="currentColor">{cells}</g>
    </svg>
  );
}
