export function normalizePath(p: string) {
  return p.replace(/\\/g, "/");
}

export function globToRegExp(glob: string) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§/g, ".*");

  return new RegExp("^" + escaped + "$");
}
