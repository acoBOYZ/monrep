import { sessionPresenceCollection } from "@monrep/db/collections";
import { getDehydratedDbState } from "@monrep/db/hydration";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** Root-route SSR dehydrate — server-only (`getRequest` must not enter the client graph). */
export const getRootDehydratedDbState = createServerFn({
  method: "GET",
  strict: { output: false },
}).handler(async () => {
  const baseUrl = new URL(getRequest().url).origin;
  return getDehydratedDbState({ baseUrl }, async ({ preload }) => {
    await preload(sessionPresenceCollection);
  });
});
