/** Browser socket PTY ownership (hibernation-safe attachment). */

export type BrowserSocketAttachment = { role: "browser"; ptyIds?: Array<string> };

const MAX_PTYS_PER_SOCKET = 8;

export const ptyIdFromCloseBody = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const pty_id = (body as { pty_id?: unknown }).pty_id;
  return typeof pty_id === "string" ? pty_id : undefined;
};

export const ptyIdFromClosedResult = (body: unknown, fallbackId: string): string =>
  ptyIdFromCloseBody(body) ?? fallbackId;

const readPtyIds = (ws: WebSocket): Array<string> => {
  const raw = ws.deserializeAttachment() as BrowserSocketAttachment | null;
  return raw?.role === "browser" && raw.ptyIds ? [...raw.ptyIds] : [];
};

const writePtyIds = (ws: WebSocket, ptyIds: Array<string>): void => {
  ws.serializeAttachment({ role: "browser", ptyIds } satisfies BrowserSocketAttachment);
};

export const trackBrowserPtyEnvelope = (
  ws: WebSocket,
  op: "pty.open" | "pty.close",
  envelopeId: string,
  body?: unknown,
): void => {
  const ptyIds = readPtyIds(ws);
  if (op === "pty.open") {
    if (!ptyIds.includes(envelopeId)) ptyIds.push(envelopeId);
    while (ptyIds.length > MAX_PTYS_PER_SOCKET) ptyIds.shift();
  } else {
    const ptyId = ptyIdFromCloseBody(body);
    if (ptyId) {
      const i = ptyIds.indexOf(ptyId);
      if (i >= 0) ptyIds.splice(i, 1);
    }
  }
  writePtyIds(ws, ptyIds);
};

export const ownedPtyIds = (ws: WebSocket): Array<string> => readPtyIds(ws);

export const removeOwnedPtyFromBrowsers = (
  browserSockets: Array<WebSocket>,
  ptyId: string,
): void => {
  for (const ws of browserSockets) {
    const ptyIds = readPtyIds(ws);
    const i = ptyIds.indexOf(ptyId);
    if (i >= 0) {
      ptyIds.splice(i, 1);
      writePtyIds(ws, ptyIds);
    }
  }
};

export const clearBrowserOwnedPtys = (ws: WebSocket): void => writePtyIds(ws, []);
