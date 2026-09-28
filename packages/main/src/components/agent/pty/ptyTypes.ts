/** Shared PTY pane types (no socket ownership). */

export type PaneApi = {
  write: (bytes: Uint8Array) => void;
  clear: () => void;
  fitAndResize: () => void;
  writeln: (line: string) => void;
  getPtyId: () => string | null;
};
