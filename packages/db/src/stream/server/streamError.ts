/**
 * Stream-proxy 4xx the Worker can map onto HTTP status.
 * Reserved for route-level failures (unknown module, bad epoch kind, …).
 */
export class StreamError extends Error {
  readonly status: 400 | 403;

  constructor(status: 400 | 403, message: string) {
    super(message);
    this.name = "StreamError";
    this.status = status;
  }
}

/** Bad or unknown epoch kind. */
export class StreamEpochError extends StreamError {
  constructor(status: 400 | 403, message: string) {
    super(status, message);
    this.name = "StreamEpochError";
  }
}

/** Unknown stream module id on `/_streams/<moduleId>`. */
export class StreamModuleError extends StreamError {
  constructor(status: 400 | 403, message: string) {
    super(status, message);
    this.name = "StreamModuleError";
  }
}
