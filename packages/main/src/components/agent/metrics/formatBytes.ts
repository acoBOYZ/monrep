/** IEC GiB, one decimal (e.g. 11.8). */
export function formatGiB(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  return (bytes / 1024 ** 3).toFixed(1);
}
