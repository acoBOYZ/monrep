import { useState, useTransition } from "react";
import { tryCatch } from "@monrep/utils";
import type { SubmitEvent } from "react";
import { createFleetServerFn } from "@/server/agent/functions";

export type CreateServerResult = {
  serverId: string | null;
  enrollToken: string;
  expiresAt: string;
};

export function useCreateServer() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateServerResult | null>(null);
  const [pending, startTransition] = useTransition();

  const submitCreateServer = (event: SubmitEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const { data, error: err } = await tryCatch(createFleetServerFn({ data: { name } }));
      if (err) {
        setError(err instanceof Error ? err.message : "Failed to create server");
        return;
      }
      setResult({
        serverId: data.server.id ?? null,
        enrollToken: data.enrollToken,
        expiresAt: data.expiresAt,
      });
    });
  };

  return { name, setName, pending, error, result, submitCreateServer };
}
