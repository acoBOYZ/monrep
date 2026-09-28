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

type SystemctlUnitJson = {
  unit?: string;
  load?: string;
  active?: string;
  sub?: string;
  description?: string;
};

/** Strip `[err] ` prefixes from sample lines before JSON parse. */
function rawLines(lines: Array<string>): Array<string> {
  return lines.map((line) => (line.startsWith("[err] ") ? line.slice(6) : line));
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

export function parseSystemctlUnitsJson(lines: Array<string>): {
  units: Array<SystemdUnit>;
  parseError: string | null;
} {
  const text = rawLines(lines).join("\n").trim();
  if (!text) return { units: [], parseError: null };

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) {
    const hint = text.slice(0, 200);
    return {
      units: [],
      parseError:
        hint.includes("Failed to") || hint.includes("Unknown")
          ? hint
          : "systemd JSON output unavailable — open PTY for interactive control.",
    };
  }

  try {
    const rows = JSON.parse(text.slice(start, end + 1)) as Array<SystemctlUnitJson>;
    const units = rows
      .map((row) => ({
        unit: row.unit ?? "",
        load: row.load ?? "",
        active: row.active ?? "",
        sub: row.sub ?? "",
        description: row.description ?? "",
      }))
      .filter((u) => u.unit.length > 0);

    units.sort((a, b) => {
      const af = a.active === "failed" || a.sub === "failed" || a.sub === "activating" ? 0 : 1;
      const bf = b.active === "failed" || b.sub === "failed" || b.sub === "activating" ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.unit.localeCompare(b.unit);
    });

    return { units, parseError: null };
  } catch {
    return {
      units: [],
      parseError: "Could not parse systemctl JSON — open PTY for interactive control.",
    };
  }
}

export function countFailedSystemdUnits(lines: Array<string>): number {
  const { units, parseError } = parseSystemctlUnitsJson(lines);
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
