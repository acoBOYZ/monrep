import { nextUlid } from "@monrep/utils/ulid";
import type { SessionEnvelope } from "@/components/agent/session-ws/sessionWs";
import { getSessionWs } from "@/components/agent/session-ws/sessionWs";

const READY_TIMEOUT_MS = 15_000;
const REPLY_TIMEOUT_MS = 12_000;

/** Transport ready = socket up (connected/ready). Ignore pty-local "error" status. */
const isTransportReady = (status: string, ready: boolean): boolean =>
  ready && (status === "connected" || status === "ready");

/** Wait for Provider-owned socket. Never opens — Provider is sole owner. */
const waitReady = (serverId: string): Promise<void> => {
  const client = getSessionWs(serverId);
  if (isTransportReady(client.status, client.ready)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.offStatus(onStatus);
      reject(new Error("session ws not ready"));
    }, READY_TIMEOUT_MS);
    const onStatus = (ready: boolean, status: string) => {
      if (!isTransportReady(status, ready)) return;
      clearTimeout(timer);
      client.offStatus(onStatus);
      resolve();
    };
    client.onStatus(onStatus);
  });
};

/** Request/response over session-ws (browser → DO → agent). */
export async function sessionRequest(
  serverId: string,
  op: string,
  body: Record<string, unknown>,
): Promise<SessionEnvelope> {
  await waitReady(serverId);
  const client = getSessionWs(serverId);
  const id = nextUlid(null);
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error("metrics request timed out"));
    }, REPLY_TIMEOUT_MS);
    const unsub = client.subscribeRun(id, (env) => {
      if (env.op !== "result" && env.op !== "error") return;
      clearTimeout(timer);
      unsub();
      resolve(env);
    });
    const ok = client.send({ v: 1, id, op, body });
    if (!ok) {
      clearTimeout(timer);
      unsub();
      reject(new Error("session ws not connected"));
    }
  });
}
