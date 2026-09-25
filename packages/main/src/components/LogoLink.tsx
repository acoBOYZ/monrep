import { SoundcloudIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { useEnvStoreWithKey } from "./shell/store.env";

export const LogoLink = () => {
  const effectiveTheme = useEnvStoreWithKey("effectiveTheme");
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
      <h1 className="-translate-y-0.5 text-xl leading-none font-semibold tracking-tight text-foreground">
        monrep
      </h1>
      <span aria-hidden="true" className="logo-wrapper__glare" />
    </Link>
  );
};
