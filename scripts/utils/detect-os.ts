import os from "node:os";

export type OS = "macos" | "linux" | "windows" | "unknown";

export function detectOS(): OS {
  const p = os.platform();

  if (p === "darwin") return "macos";
  if (p === "linux") return "linux";
  if (p === "win32") return "windows";

  return "unknown";
}
