import { promise as fastqPromise } from "fastq";
import { timeLogger } from "../timeLogger";
import { withTimeout } from "./withTimeout";

export type WithGracefullyProps = {
  label: string;
  fn: () => unknown;
  timeout: number;
};

let taskId = 0;

/**
 * Gracefully shuts down a list of async services concurrently with logging and optional timeout wrapping.
 *
 * @param services - An array of services with a label and shutdown function.
 * @param concurrency - How many shutdowns to run in parallel (default: 1).
 * @returns Resolves when all shutdown attempts complete (fulfilled or rejected).
 */
export async function withGracefully(
  services: Array<WithGracefullyProps>,
  concurrency = 1,
): Promise<void> {
  const queue = fastqPromise(async ({ label, fn, timeout }: WithGracefullyProps) => {
    try {
      const id = `${++taskId}: ✅ ${label} shut down.`;
      timeLogger.start(id);
      await withTimeout(label, () => fn(), timeout);
      timeLogger.end(id);
    } catch (err) {
      console.error(`❌ ${label} shutdown failed:`, err);
    }
  }, concurrency);

  for (const service of services) void queue.push(service);
  await queue.drained();
  console.info("📦 All shutdown tasks completed.");
}
