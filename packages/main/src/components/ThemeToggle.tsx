import { Computer, Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import type { Theme } from "@/components/shell/store.env";
import { setTheme, useEnvStoreWithKey } from "@/components/shell/store.env";

const NEXT_THEME: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function ThemeToggle() {
  const theme = useEnvStoreWithKey("theme");
  const next = NEXT_THEME[theme];

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
    >
      {theme === "system" ? (
        <HugeiconsIcon icon={Computer} />
      ) : theme === "light" ? (
        <HugeiconsIcon icon={Sun} />
      ) : (
        <HugeiconsIcon icon={Moon} />
      )}
    </Button>
  );
}
