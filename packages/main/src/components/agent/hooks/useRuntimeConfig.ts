import { useTransition } from "react";
import { toast } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import type { TServerDo } from "@/db/types";
import { useStreamDb } from "@/db/useStreamDb";
import { pushAgentConfigFn, sendAgentUpdateFn } from "@/server/agent/functions";

type RuntimePatch = {
  backgroundEnabled?: boolean;
  autoUpdate?: boolean;
  metricsIntervalSec?: number;
};

export function useRuntimeConfig(serverId: string) {
  const { db, isReady } = useStreamDb("agent");
  const { data: row } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ r: db.collections.runtime_config })
        .where(({ r }) => eq(r.serverId, serverId))
        .join({ s: db.collections.server }, ({ r, s }) => eq(r.serverId, s.id))
        .select(({ r, s }) => ({
          backgroundEnabled: r.backgroundEnabled,
          autoUpdate: r.autoUpdate,
          metricsIntervalSec: r.metricsIntervalSec,
          serverName: s.name,
          serverStatus: s.status,
          serverDeviceId: s.deviceId,
          serverLastSeenAt: s.lastSeenAt,
          serverAgentVersion: s.agentVersion,
          serverCreatedAt: s.createdAt,
        }))
        .findOne();
    },
  });

  const metricsEnabled = row?.backgroundEnabled ?? true;
  const autoUpdate = row?.autoUpdate ?? true;
  const metricsIntervalSec = row?.metricsIntervalSec ?? 30;
  const serverName = row?.serverName ?? "Unknown";

  const [pending, startTransition] = useTransition();

  const save = (partial: RuntimePatch) => {
    if (!db) {
      toast.error("Stream not ready");
      return;
    }
    const nextBackground = partial.backgroundEnabled ?? metricsEnabled;
    const nextAutoUpdate = partial.autoUpdate ?? autoUpdate;
    const nextInterval = partial.metricsIntervalSec ?? metricsIntervalSec;
    startTransition(async () => {
      const { error: err } = await tryCatch(
        db.actions
          .upsertRuntimeConfig({
            serverId,
            backgroundEnabled: nextBackground,
            autoUpdate: nextAutoUpdate,
            metricsIntervalSec: nextInterval,
          })
          .when("settled"),
      );

      if (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        return;
      }
      await pushAgentConfigFn({
        data: {
          serverId,
          autoUpdate: nextAutoUpdate,
          metricsEnabled: nextBackground,
          metricsIntervalSec: nextInterval,
        },
      });
      toast.success("Saved");
    });
  };

  const saveServerName = (name: string) => {
    if (!db) {
      toast.error("Stream not ready");
      return;
    }
    const next = name.trim();
    if (!next || next === serverName) return;
    if (!row?.serverStatus) {
      toast.error("Server row not ready");
      return;
    }
    // Upsert schema requires status — partial { id, name } throws SchemaValidationError.
    const payload: TServerDo = {
      id: serverId,
      name: next,
      status: row.serverStatus,
      deviceId: row.serverDeviceId,
      lastSeenAt: row.serverLastSeenAt,
      agentVersion: row.serverAgentVersion,
      createdAt: row.serverCreatedAt,
    };
    startTransition(async () => {
      const { error: err } = await tryCatch(db.actions.upsertServer(payload).when("settled"));
      if (err) {
        toast.error(err instanceof Error ? err.message : "Rename failed");
        return;
      }
      toast.success("Server name saved");
    });
  };

  const triggerUpdate = () => {
    startTransition(async () => {
      const { data, error: err } = await tryCatch(sendAgentUpdateFn({ data: { serverId } }));
      if (err) {
        toast.error(err instanceof Error ? err.message : "Update request failed");
        return;
      }
      if (!data.ok) {
        toast.error("Agent session not connected");
        return;
      }
      toast.success("Update requested — agent will restart if a newer binary is available");
    });
  };

  return {
    isReady,
    metricsEnabled,
    metricsIntervalSec,
    autoUpdate,
    save,
    saveServerName,
    triggerUpdate,
    pending,
    serverName,
  };
}
