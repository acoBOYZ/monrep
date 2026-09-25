import { toast } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";

/** Run async auth work with pending flag; no try/finally (React Compiler). */
export async function withAuthPending<T>(
  setPending: (pending: boolean) => void,
  work: () => Promise<T>,
  fallbackMessage: string,
): Promise<{ ok: true; value: T } | { ok: false }> {
  setPending(true);
  const { data: value, error } = await tryCatch(work());
  if (error) {
    toast.error(error instanceof Error ? error.message : fallbackMessage);
    setPending(false);
    return { ok: false };
  }

  setPending(false);
  return { ok: true, value };
}
