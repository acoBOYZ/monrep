/** Compare semver-ish strings (digits and dots). True if `remote` is newer than `local`. */
export function isNewerAgentVersion(remote: string, local: string): boolean {
  const parse = (s: string) =>
    s
      .replace(/^v/i, "")
      .split(".")
      .map((p) => Number.parseInt(p, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const a = parse(remote);
  const b = parse(local);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

export function isAgentBehindDesired(agentVersion: string | undefined, desired: string): boolean {
  if (!agentVersion) return true;
  return isNewerAgentVersion(desired, agentVersion);
}
