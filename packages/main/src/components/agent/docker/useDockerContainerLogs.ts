import { useCallback, useEffect, useEffectEvent, useState } from "react";
import type { DockerContainer } from "@/components/agent/utils/opsParse";
import { useOpsServer } from "@/components/agent/hooks/useOpsServer";
import { useSessionRun } from "@/components/agent/hooks/useSessionRun";
import { DOCKER_LIST_ARGV } from "@/components/agent/utils/opsListArgv";
import { parseDockerPsNdjson } from "@/components/agent/utils/opsParse";

export const LOG_TAIL_OPTIONS = [50, 100, 200, 500] as const;
export type LogTail = (typeof LOG_TAIL_OPTIONS)[number];
export const DEFAULT_LOG_TAIL: LogTail = 100;

const logsArgv = (containerId: string, tail: LogTail) =>
  ["docker", "logs", "--tail", String(tail), containerId] as Array<string>;

function matchContainer(containers: Array<DockerContainer>, containerId: string) {
  return containers.find((c) => c.id === containerId || c.id.startsWith(containerId)) ?? null;
}

type ContainerBag = { key: string; value: DockerContainer | null };

export function useDockerContainerLogs(serverId: string, containerId: string) {
  const { server, isReady, online } = useOpsServer(serverId);
  const { lines, busy, error, run, runAsync, cancel } = useSessionRun(serverId);
  const key = `${serverId}:${containerId}`;
  const [bag, setBag] = useState<ContainerBag>({ key, value: null });
  const [tail, setTailState] = useState<LogTail>(DEFAULT_LOG_TAIL);
  if (bag.key !== key) {
    setBag({ key, value: null });
  }
  const container = bag.key === key ? bag.value : null;

  const startLogs = useEffectEvent(() => {
    if (!online) return;
    run(logsArgv(containerId, tail));
  });

  useEffect(() => {
    startLogs();
  }, [key, online]);

  const setTail = useCallback(
    (next: LogTail) => {
      setTailState(next);
      if (!online) return;
      const argv = logsArgv(containerId, next);
      if (busy) {
        cancel();
        run(argv);
        return;
      }
      run(argv);
    },
    [online, busy, cancel, run, containerId],
  );

  const refreshLogs = useCallback(() => {
    if (!online || busy) return;
    run(logsArgv(containerId, tail));
  }, [online, busy, run, containerId, tail]);

  const refreshContainer = useCallback(() => {
    if (!online || busy) return;
    void runAsync([...DOCKER_LIST_ARGV])
      .then((listLines) => {
        const { containers } = parseDockerPsNdjson(listLines);
        setBag({ key, value: matchContainer(containers, containerId) });
      })
      .catch(() => {
        /* error in hook state */
      });
  }, [online, busy, runAsync, containerId, key]);

  const runVerb = useCallback(
    (argv: Array<string>, onDone?: () => void) => {
      if (!online || busy) return;
      void runAsync(argv)
        .then(() => {
          onDone?.();
          run(logsArgv(containerId, tail));
        })
        .catch(() => {
          /* error in hook state */
        });
    },
    [online, busy, runAsync, run, containerId, tail],
  );

  return {
    server,
    isReady,
    online,
    container,
    lines,
    busy,
    error,
    cancel,
    tail,
    setTail,
    refreshLogs,
    refreshContainer,
    runVerb,
  };
}

export type DockerContainerLogsOps = ReturnType<typeof useDockerContainerLogs>;
