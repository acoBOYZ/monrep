/** In-memory PTY/browser reply routing (hints only; lost on DO eviction). */

const MAX_BROWSER_REQUEST_IDS = 500;
const MAX_BROWSER_PTY_IDS = 50;

type EnvelopeLike = {
  id: string;
  op: string;
  body?: unknown;
};

const bodyPtyId = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const pty_id = (body as { pty_id?: unknown }).pty_id;
  return typeof pty_id === "string" ? pty_id : undefined;
};

const isClosedResult = (body: unknown): boolean =>
  !!body && typeof body === "object" && (body as { closed?: unknown }).closed === true;

export class BrowserReplyRouter {
  private readonly browserRequestIds = new Set<string>();
  private readonly browserPtyIds = new Set<string>();

  trackBrowserEnvelope(envelope: EnvelopeLike): void {
    this.browserRequestIds.add(envelope.id);
    if (this.browserRequestIds.size > MAX_BROWSER_REQUEST_IDS) {
      this.browserRequestIds.clear();
    }
    if (envelope.op === "pty.open") {
      this.browserPtyIds.add(envelope.id);
      if (this.browserPtyIds.size > MAX_BROWSER_PTY_IDS) {
        this.browserPtyIds.clear();
      }
    }
    if (envelope.op === "pty.close") {
      const ptyId = bodyPtyId(envelope.body) ?? envelope.id;
      this.browserPtyIds.delete(ptyId);
    }
  }

  shouldForwardResult(envelope: EnvelopeLike): boolean {
    if (this.browserRequestIds.has(envelope.id)) return true;
    const body = envelope.body;
    if (bodyPtyId(body)) return true;
    if (isClosedResult(body)) return true;
    return false;
  }

  afterForwardResult(envelope: EnvelopeLike): void {
    if (this.browserRequestIds.has(envelope.id)) {
      this.browserRequestIds.delete(envelope.id);
    }
    if (isClosedResult(envelope.body)) {
      const ptyId = bodyPtyId(envelope.body) ?? envelope.id;
      this.browserPtyIds.delete(ptyId);
    }
  }

  shouldForwardError(envelope: EnvelopeLike): boolean {
    if (this.browserRequestIds.has(envelope.id)) return true;
    if (bodyPtyId(envelope.body)) return true;
    if (this.browserPtyIds.has(envelope.id)) return true;
    return false;
  }

  afterForwardError(envelope: EnvelopeLike): void {
    if (this.browserRequestIds.has(envelope.id)) {
      this.browserRequestIds.delete(envelope.id);
    }
  }
}
