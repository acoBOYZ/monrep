import type { MetricPoint } from "./types";

const LOADAVG_RE = /^(\d+\.\d+) (\d+\.\d+) (\d+\.\d+) /;
const UPTIME_COMMA_RE = /load averages?:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/i;
const UPTIME_SPACE_RE = /load averages?:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i;
const FREE_M_RE = /^Mem:\s+(\d+)\s+(\d+)/;
const MEM_AWK_RE = /^mem\s+(\d+)\s+(\d+)(?:\s+(\d+))?/;
const DISK_AWK_RE = /^disk\s+(\d+)\s+(\d+)/;
const CORES_RE = /^\d+$/;
const MIB = 1048576;

function roundPct(n: number): number {
  return Math.round(n * 10) / 10;
}

function applyLoad(out: Partial<MetricPoint>, l1: number, l5: number, l15: number): void {
  out.load1 = l1;
  out.load5 = l5;
  out.load15 = l15;
}

export function parseMetricLines(lines: ReadonlyArray<string>): Partial<MetricPoint> {
  const out: Partial<MetricPoint> = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === "---") continue;

    const loadavg = LOADAVG_RE.exec(line);
    if (loadavg) {
      applyLoad(out, Number(loadavg[1]), Number(loadavg[2]), Number(loadavg[3]));
      continue;
    }

    const uptime = UPTIME_COMMA_RE.exec(line) ?? UPTIME_SPACE_RE.exec(line);
    if (uptime) {
      applyLoad(out, Number(uptime[1]), Number(uptime[2]), Number(uptime[3]));
      continue;
    }

    const freeM = FREE_M_RE.exec(line);
    if (freeM) {
      const total = Number(freeM[1]) * MIB;
      const used = Number(freeM[2]) * MIB;
      out.memTotalBytes = total;
      out.memUsedBytes = used;
      if (total > 0) out.memPct = roundPct((used / total) * 100);
      continue;
    }

    const memAwk = MEM_AWK_RE.exec(line);
    if (memAwk) {
      const total = Number(memAwk[1]);
      const used = Number(memAwk[2]);
      const avail = memAwk[3] !== undefined ? Number(memAwk[3]) : undefined;
      out.memTotalBytes = total;
      out.memUsedBytes = used;
      if (total > 0) {
        const pct = avail !== undefined ? ((total - avail) / total) * 100 : (used / total) * 100;
        out.memPct = roundPct(pct);
      }
      continue;
    }

    const diskAwk = DISK_AWK_RE.exec(line);
    if (diskAwk) {
      const totalKb = Number(diskAwk[1]);
      const usedKb = Number(diskAwk[2]);
      if (totalKb > 0) out.diskPct = roundPct((usedKb / totalKb) * 100);
      continue;
    }

    if (CORES_RE.test(line)) out.cores = Number(line);
  }
  return out;
}
