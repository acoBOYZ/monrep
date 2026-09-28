import { cn } from "@monrep/utils";
import { Avatar } from "../base/avatar";
import { ColorIcon } from "./colorize-icon";
import type { ComponentPropsWithRef } from "react";
import type { ColorIconProps } from "./colorize-icon";

export interface GavatarProps extends ComponentPropsWithRef<typeof Avatar> {
  fallbackOnly?: boolean;
  src?: string | null;
  fallback?: string | null;
  useVideo?: boolean;
  useColor?: boolean;
  colorMode?: ColorIconProps["mode"];
}

function getGavatarFallback(name: string | null) {
  if (!name) return "CN";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0]?.[0]}${parts[1]?.[0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Gavatar = ({
  fallbackOnly,
  src,
  fallback,
  useVideo = true,
  useColor = false,
  colorMode = "atari",
  shape,
  className,
  ...props
}: GavatarProps) => {
  const resolvedSrc = fallbackOnly ? undefined : src || undefined;

  return (
    <Avatar
      {...props}
      shape={shape}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center overflow-clip border bg-muted",
        className,
      )}
      render={(rootProps) => (
        <div {...rootProps}>
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={fallbackOnly ? "@fallback" : "@you"}
              className="size-full object-cover"
            />
          ) : useColor ? (
            <span className="@container-size relative block size-full">
              <ColorIcon
                name={fallback ?? "RB"}
                className="size-full object-cover"
                mode={colorMode}
              />
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center text-[38cqw] leading-none font-bold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]"
              >
                {getGavatarFallback(fallback ?? "RB")}
              </span>
            </span>
          ) : useVideo ? (
            <video
              src="/profile.webm"
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold">{getGavatarFallback(fallback ?? "RB")}</span>
          )}
        </div>
      )}
    />
  );
};
