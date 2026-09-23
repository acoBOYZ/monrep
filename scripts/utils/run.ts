export function run(cmd: Array<string>, opts?: { cwd?: string; env?: Record<string, string> }) {
  const proc = Bun.spawnSync({
    cmd,
    cwd: opts?.cwd,
    env: {
      ...process.env,
      ...opts?.env,
    },
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  if (proc.exitCode !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}`);
  }
}
