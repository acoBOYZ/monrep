/**
 * Wraps an async operation with a timeout.
 *
 * @param label - A human-readable label for logging.
 * @param fn - The async function to execute.
 * @param timeout - Timeout in milliseconds. default: 5_000
 * @returns The result of the async function, or throws if it times out or fn() rejects.
 */
export async function withTimeout<T>(
  label: string,
  fn: () => Promise<T> | T,
  timeout = 5_000,
): Promise<T | undefined> {
  return await Promise.race<T>([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} shutdown timeout`)), timeout),
    ),
  ]);
}
