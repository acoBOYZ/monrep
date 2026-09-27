import { useEffect } from "react";
import { getItemWithExpiry } from "@monrep/hooks";
import { useSelector } from "@tanstack/react-store";
import { THEME_KEY, storeTheme } from "./store.theme";
import type { EffectiveTheme, Theme } from "./store.theme";

const isTheme = (value: unknown): value is Theme =>
  value === "dark" || value === "light" || value === "system";

const readStoredTheme = (): Theme => {
  const stored = getItemWithExpiry<Theme>(THEME_KEY);
  return isTheme(stored) ? stored : "system";
};

const getSystemTheme = (): EffectiveTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeEnv = () => {
  const theme = useSelector(storeTheme, (s) => s.theme);

  // Hydrate preference from app-store once (same key as ThemeProvider).
  useEffect(() => {
    const stored = readStoredTheme();
    storeTheme.setState((prev) => (prev.theme === stored ? prev : { ...prev, theme: stored }));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    let transitionTimer: number | null = null;

    const markThemeSwitching = () => {
      root.classList.add("theme-switching");
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
      }
      transitionTimer = window.setTimeout(() => {
        root.classList.remove("theme-switching");
        transitionTimer = null;
      }, 0);
    };

    const applyEffective = (effective: EffectiveTheme) => {
      markThemeSwitching();
      root.classList.remove("light", "dark", "system");
      root.classList.add(effective);
      if (theme === "system") root.classList.add("system");
      root.style.colorScheme = effective;
      storeTheme.setState((prev) =>
        prev.effectiveTheme === effective ? prev : { ...prev, effectiveTheme: effective },
      );
    };

    const resolveAndApply = () => {
      applyEffective(theme === "system" ? getSystemTheme() : theme);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorSchemeChange = () => {
      if (storeTheme.state.theme !== "system") return;
      applyEffective(getSystemTheme());
    };

    mediaQuery.addEventListener("change", onColorSchemeChange);
    resolveAndApply();

    return () => {
      mediaQuery.removeEventListener("change", onColorSchemeChange);
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
      }
      root.classList.remove("theme-switching");
    };
  }, [theme]);

  return null;
};
