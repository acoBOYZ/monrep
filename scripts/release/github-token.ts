/** Ensure `GITHUB_TOKEN` is set for git-cliff GitHub remote metadata (@user / #PR). */
export function ensureGithubToken(): void {
  if (process.env.GITHUB_TOKEN) return;

  const ghToken = process.env.GH_TOKEN?.trim();
  if (ghToken) {
    process.env.GITHUB_TOKEN = ghToken;
    return;
  }

  const result = Bun.spawnSync(["gh", "auth", "token"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode === 0) {
    const token = result.stdout.toString().trim();
    if (token) {
      process.env.GITHUB_TOKEN = token;
      return;
    }
  }

  console.warn(
    "[release] no GITHUB_TOKEN / GH_TOKEN / gh auth — changelog will omit @user and #PR",
  );
}
