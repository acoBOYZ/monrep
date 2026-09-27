type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 *
 * @param promise The promise to run.
 * @returns A result object with the data and error.
 * @example
 * const result = await tryCatch(Promise.resolve("Hello, world!"));
 * console.log(result); // { data: "Hello, world!", error: null }
 *
 * const result = await tryCatch(Promise.reject(new Error("An error occurred")));
 * console.log(result); // { data: null, error: Error: An error occurred }
 */
export async function tryCatch<T, E = Error>(promise: Promise<T> | T): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as E };
  }
}
