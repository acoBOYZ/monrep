export type DockerContainer = {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
};

export type SystemdUnit = {
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
};

type DockerPsJson = {
  ID?: string;
  Id?: string;
  Names?: string;
  Image?: string;
  Status?: string;
  State?: string;
  Ports?: string;
};

const UNIT_PLAIN_RE = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/;

/** Strip `[err] ` prefixes from sample lines before parse. */
function rawLines(lines: Array<string>): Array<string> {
  return lines.map((line) => (line.startsWith("[err] ") ? line.slice(6) : line));
}

function isSpawnOrSystemctlError(line: string): boolean {
  return (
    line.startsWith("exit ") ||
    line.startsWith("Failed to") ||
    line.startsWith("Unknown") ||
    /command not found|no such file|os error|permission denied|not found/i.test(line)
  );
}

function isServiceUnitName(unit: string): boolean {
  // list-units --type=service always uses *.service (incl. foo@bar.service)
  return unit.endsWith(".service");
}

export function parseDockerPsNdjson(lines: Array<string>): {
  containers: Array<DockerContainer>;
  parseError: string | null;
} {
  const containers: Array<DockerContainer> = [];
  const joined = rawLines(lines).join("\n").trim();
  if (!joined) return { containers, parseError: null };

  for (const line of rawLines(lines)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "busy") continue;
    if (trimmed.startsWith("exit ") || trimmed.includes("command not found")) {
      return { containers: [], parseError: trimmed };
    }
    try {
      const row = JSON.parse(trimmed) as DockerPsJson;
      const id = row.ID ?? row.Id ?? "";
      const name = (row.Names ?? id).replace(/^\//, "");
      if (!id && !name) continue;
      containers.push({
        id,
        name: name || id,
        image: row.Image ?? "—",
        status: row.Status ?? "—",
        state: (row.State ?? "").toLowerCase() || "unknown",
        ports: row.Ports ?? "",
      });
    } catch {
      if (trimmed.startsWith("{")) continue;
      return { containers: [], parseError: trimmed };
    }
  }

  containers.sort((a, b) => {
    const ar = a.state === "running" ? 1 : 0;
    const br = b.state === "running" ? 1 : 0;
    if (ar !== br) return ar - br;
    return a.name.localeCompare(b.name);
  });

  return { containers, parseError: null };
}

export function parseSystemctlUnitsPlain(lines: Array<string>): {
  units: Array<SystemdUnit>;
  parseError: string | null;
} {
  const units: Array<SystemdUnit> = [];
  const joined = rawLines(lines).join("\n").trim();
  if (!joined) return { units, parseError: null };

  for (const line of rawLines(lines)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "busy") continue;
    if (isSpawnOrSystemctlError(trimmed)) {
      return { units: [], parseError: trimmed.slice(0, 200) };
    }
    // Legend / footer noise from older systemctl without --no-legend
    if (/^(UNIT|LOAD|ACTIVE|SUB|DESCRIPTION)\b/i.test(trimmed)) continue;
    if (/^(\d+ loaded units listed|\s*To show all)/i.test(trimmed)) continue;

    const m = UNIT_PLAIN_RE.exec(trimmed);
    if (!m) {
      return { units: [], parseError: trimmed.slice(0, 200) || "could not parse systemctl list" };
    }
    const [, unit, load, active, sub, description] = m;
    if (!unit || !isServiceUnitName(unit)) {
      return { units: [], parseError: trimmed.slice(0, 200) || "could not parse systemctl list" };
    }
    units.push({
      unit,
      load: load ?? "",
      active: active ?? "",
      sub: sub ?? "",
      description: (description ?? "").trim(),
    });
  }

  units.sort((a, b) => {
    const af = a.active === "failed" || a.sub === "failed" || a.sub === "activating" ? 0 : 1;
    const bf = b.active === "failed" || b.sub === "failed" || b.sub === "activating" ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.unit.localeCompare(b.unit);
  });

  return { units, parseError: null };
}

export function countFailedSystemdUnits(lines: Array<string>): number {
  const { units, parseError } = parseSystemctlUnitsPlain(lines);
  if (parseError) return 0;
  return units.filter((u) => u.active === "failed" || u.sub === "failed").length;
}

export function countUnhealthyDocker(lines: Array<string>): number {
  const { containers, parseError } = parseDockerPsNdjson(lines);
  if (parseError) return 0;
  return containers.filter(
    (c) => c.state !== "running" || c.status.toLowerCase().includes("unhealthy"),
  ).length;
}
