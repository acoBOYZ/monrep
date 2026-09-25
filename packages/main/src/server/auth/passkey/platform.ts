/** Prefer platform authenticators (Face ID / Touch ID / Hello) — teamboyz pattern. */
export const withClientDeviceHint = <T extends { hints?: Array<string> }>(options: T): T => ({
  ...options,
  hints: ["client-device"],
});

/** Ceremony + stored transports: platform only (`internal`). */
export const platformTransports = ["internal"] as const;
