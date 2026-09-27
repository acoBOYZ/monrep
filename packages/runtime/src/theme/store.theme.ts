import { setItemWithExpiry } from "@monrep/hooks";
import { createStore } from "@tanstack/react-store";

export const THEME_KEY = "ui:theme";
export type Theme = "dark" | "light" | "system";
export type EffectiveTheme = Exclude<Theme, "system">;

type StoreTheme = {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
};

const readInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  try {
    // Same bucket/key as ThemeProvider (`useLocalStorage("ui:theme")`).
    const raw = localStorage.getItem("app-store:v1");
    if (!raw) return "system";
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "system";
    const entry = (parsed as Record<string, { value?: unknown }>)["ui:theme"];
    const value = entry?.value;
    return value === "dark" || value === "light" || value === "system" ? value : "system";
  } catch {
    return "system";
  }
};

const initialTheme = readInitialTheme();

const initialState: StoreTheme = {
  theme: initialTheme,
  effectiveTheme: "light",
};

export const storeTheme = createStore<StoreTheme>(initialState);

/** Persist preference and update the env store. ThemeEnv applies the DOM. */
export const setTheme = (theme: Theme) => {
  setItemWithExpiry(THEME_KEY, theme);
  storeTheme.setState((prev) => (prev.theme === theme ? prev : { ...prev, theme }));
};
