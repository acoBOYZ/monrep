import type { ErrorRun } from "./types";

type ErrorRunDraft = {
  serverId: string;
  runId: string;
  at: number;
  lines: number;
  stdoutLines: Array<string>;
};

export function finalizeErrorRuns(drafts: ReadonlyArray<ErrorRunDraft>): Array<ErrorRun> {
  const prevLinesByServer = new Map<string, Set<string>>();
  return drafts.map((draft) => {
    const prev = prevLinesByServer.get(draft.serverId) ?? new Set<string>();
    let newLines = 0;
    for (const line of draft.stdoutLines) {
      if (!prev.has(line)) newLines += 1;
    }
    prevLinesByServer.set(draft.serverId, new Set(draft.stdoutLines));
    return {
      serverId: draft.serverId,
      runId: draft.runId,
      at: draft.at,
      lines: draft.lines,
      newLines,
    };
  });
}
