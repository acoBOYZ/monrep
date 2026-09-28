import { useEffect, useRef, useState } from "react";
import { useSessionRun } from "./useSessionRun";
import {
  countFailedSystemdUnits,
  countUnhealthyDocker,
  parseDockerPsNdjson,
} from "@/components/agent/utils/opsParse";

export function useOpsGlance(serverId: string, online: boolean) {
  const { busy, runAsync } = useSessionRun(serverId);
  const [dockerBad, setDockerBad] = useState<number | null>(null);
  const [dockerTotal, setDockerTotal] = useState<number | null>(null);
  const [servicesFailed, setServicesFailed] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "docker" | "services" | "done">("idle");
  const bootRef = useRef(false);

  useEffect(() => {
    if (!online || bootRef.current) return;
    bootRef.current = true;
    void runAsync(["docker", "ps", "-a", "--format", "{{json .}}"])
      .then((lines) => {
        const { containers } = parseDockerPsNdjson(lines);
        setDockerTotal(containers.length);
        setDockerBad(countUnhealthyDocker(lines));
        setPhase("services");
        return runAsync(["systemctl", "--failed", "--type=service", "--no-pager", "--output=json"]);
      })
      .then((lines) => {
        setServicesFailed(countFailedSystemdUnits(lines));
        setPhase("done");
      })
      .catch(() => {
        setPhase("done");
      });
  }, [online, runAsync]);

  const scanning = online && phase !== "done";

  return { dockerBad, dockerTotal, servicesFailed, scanning, busy };
}
