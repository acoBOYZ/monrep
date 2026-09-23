import { spawnSync } from "bun";

export function hasBinary(bin: string): boolean {
  const r = spawnSync(["which", bin], { stdout: "ignore", stderr: "ignore" });
  return r.exitCode === 0;
}
