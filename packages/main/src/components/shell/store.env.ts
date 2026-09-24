import { setItemWithExpiry } from "@monrep/hooks";
import { createStore, useSelector } from "@tanstack/react-store";

export const THEME_KEY = "ui:theme";
export type Theme = "dark" | "light" | "system";
export type EffectiveTheme = Exclude<Theme, "system">;

export type StoreEnv = {
  isOnline: boolean;
  isMobile: boolean;
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

const initialState: StoreEnv = {
  isOnline: true,
  isMobile: false,
  theme: initialTheme,
  effectiveTheme: "light",
};

export const storeEnv = createStore<StoreEnv>(initialState);

/**
 * Hook to get a specific key from the env store.
 *
 * Keys: "isOnline", "isMobile", "theme", "effectiveTheme"
 *
 * @param key - The key to get from the env store.
 * @returns The value of the key.
 * @example
 * const isMobile = useEnvStoreWithKey("isMobile");
 */
export const useEnvStoreWithKey = <K extends keyof StoreEnv>(key: K): StoreEnv[K] => {
  return useSelector(storeEnv, (s) => s[key]);
};

export const useEnvStore = () => {
  return useSelector(storeEnv, (s) => s);
};

/** Persist preference and update the env store. ThemeEnv applies the DOM. */
export const setTheme = (theme: Theme) => {
  setItemWithExpiry(THEME_KEY, theme);
  storeEnv.setState((prev) => (prev.theme === theme ? prev : { ...prev, theme }));
};
