import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const APP_STORE_KEY = "app-store:v1";

type StoredEntry<T = unknown> = {
  value: T;
  ttl: number | null;
};

type Store = Record<string, StoredEntry>;

const isBrowser = typeof window !== "undefined";

const readStore = (): Store => {
  if (!isBrowser) return {};
  const raw = localStorage.getItem(APP_STORE_KEY);
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    localStorage.removeItem(APP_STORE_KEY);
    return {};
  }
};

const writeStore = (store: Store): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(APP_STORE_KEY, JSON.stringify(store));
  } catch {
    // quota / disabled → noop
  }
};

const purgeExpired = (store: Store): Store => {
  if (!isBrowser) return store;
  const now = Date.now();
  let mutated = false;
  const next: Store = {};

  for (const [key, entry] of Object.entries(store)) {
    if (typeof entry !== "object" || (entry.ttl && now > entry.ttl)) {
      mutated = true;
    } else {
      next[key] = entry;
    }
  }

  if (mutated) writeStore(next);
  return mutated ? next : store;
};

/**
 * Reads a value from the shared `app-store` bucket, dropping it if expired.
 * @template T
 * @param key Unique key within the shared store.
 * @returns Stored value or `undefined` if missing, expired, or unavailable.
 */
export function getItemWithExpiry<T>(key: string): T | undefined {
  const store = purgeExpired(readStore());
  const entry = store[key];
  return entry ? (entry.value as T) : undefined;
}

/**
 * Writes a value into the shared `app-store` bucket with an optional TTL.
 * @template T
 * @param key Unique key within the shared store.
 * @param value Value to persist.
 * @param ttl Optional time-to-live in milliseconds; when provided the entry is dropped after expiry.
 */
export function setItemWithExpiry<T>(key: string, value: T, ttl?: number): void {
  const store = purgeExpired(readStore());
  store[key] = {
    value,
    ttl: ttl ? Date.now() + ttl : null,
  };
  writeStore(store);
}

/**
 * Removes a key from the shared `app-store` bucket.
 * @param key Unique key within the shared store.
 */
function removeItem(key: string): void {
  const store = purgeExpired(readStore());
  if (!store[key]) return;
  delete store[key];
  writeStore(store);
}

/**
 * React hook for reading/writing a value inside the shared `app-store` object with TTL support.
 * @template T
 * @param key Unique key within the shared store.
 * @param defaultValue Value used when nothing is stored.
 * @param ttl Optional time-to-live in milliseconds; when provided the entry is dropped after expiry.
 * @returns Tuple containing the current value and a setter.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  ttl?: number,
): [T, Dispatch<SetStateAction<T>>] {
  const initialized = useRef(false);

  const [value, setValue] = useState<T>(() => {
    const storedValue = getItemWithExpiry<T>(key);
    return storedValue !== undefined ? storedValue : defaultValue;
  });

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (value === undefined) {
      removeItem(key);
    } else {
      setItemWithExpiry(key, value, ttl);
    }
  }, [key, ttl, value]);

  return [value, setValue];
}
