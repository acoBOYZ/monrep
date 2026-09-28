import { Computer, Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { setTheme, storeTheme } from "@monrep/runtime";
import { Button, TooltipTrigger } from "@monrep/ui/base";
import { useSelector } from "@tanstack/react-store";
import type { Theme } from "@monrep/runtime";

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
  const theme = useSelector(storeTheme, (s) => s.theme);
  const next = NEXT_THEME[theme];

  return (
    <TooltipTrigger content={`Theme: ${LABEL[theme]} - click for ${LABEL[next]}`}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setTheme(next)}
        aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
      >
        {theme === "system" ? (
          <HugeiconsIcon icon={Computer} className="size-5" />
        ) : theme === "light" ? (
          <HugeiconsIcon icon={Sun} className="size-5" />
        ) : (
          <HugeiconsIcon icon={Moon} className="size-5" />
        )}
      </Button>
    </TooltipTrigger>
  );
}
