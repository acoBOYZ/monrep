import { SoundcloudIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { useEnvStoreWithKey } from "./shell/store.env";
import type { ElementType } from "react";

type LogoLinkProps = {
  /** Landing pages pass `"span"` so the hero can own the sole `h1`. Defaults to `h1` (admin). */
  titleAs?: "h1" | "span";
};

export const LogoLink = ({ titleAs = "h1" }: LogoLinkProps) => {
  const effectiveTheme = useEnvStoreWithKey("effectiveTheme");
  const Title = titleAs as ElementType;
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-1.5",
        effectiveTheme === "light" ? "logo-wrapper-light" : "logo-wrapper-dark",
      )}
    >
      <HugeiconsIcon
        icon={SoundcloudIcon}
        className="size-5.5 shrink-0 text-primary"
        strokeWidth={2}
      />
      <Title className="-translate-y-0.5 text-xl leading-none font-semibold tracking-tight text-foreground">
        monrep
      </Title>
      <span aria-hidden="true" className="logo-wrapper__glare" />
    </Link>
  );
};
