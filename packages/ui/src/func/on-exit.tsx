import { useEffect, useRef } from "react";

export type OnExitReason = "leave" | "hide" | "unmount";

const ALL_REASONS: ReadonlyArray<OnExitReason> = ["leave", "hide", "unmount"];
const DEFAULT_DEFER_UNMOUNT_MS = 50;

const pendingUnmounts = new Map<string, ReturnType<typeof setTimeout>>();
const flushedKeys = new Set<string>();

const cancelPendingUnmount = (key: string | null) => {
  if (key == null) return;
  const timer = pendingUnmounts.get(key);
  if (timer == null) return;
  clearTimeout(timer);
  pendingUnmounts.delete(key);
};

const emit = (
  onExit: (reason: OnExitReason, sessionKey: string | null) => void,
  reason: OnExitReason,
  exitingKey: string | null,
) => {
  if (exitingKey != null && flushedKeys.has(exitingKey)) return;
  if (exitingKey != null) flushedKeys.add(exitingKey);
  onExit(reason, exitingKey);
};

export type OnExitProps = {
  /** Fires when `sessionKey` changes (leave previous session). Required for `when` including `"leave"`. */
  sessionKey?: string | null;
  /** Which events invoke `onExit`. Default: all three. */
  when?: ReadonlyArray<OnExitReason>;
  /**
   * Invoked with the exiting session key (previous key on leave; current on hide/unmount).
   * Called only from lifecycle handlers — never during render.
   */
  onExit: (reason: OnExitReason, sessionKey: string | null) => void;
  /** Defer `"unmount"` only (StrictMode); cancel on remount of the same key. Default 50. */
  deferUnmountMs?: number;
};

/**
 * Null-render lifecycle helper. Single `onExit` callback with typesafe `when` keys.
 * Leave/hide/unmount coalesce per session key (first reason wins); switching keys does not rebind hide/unmount.
 */
export function OnExit(props: OnExitProps) {
  const sessionKey = props.sessionKey ?? null;
  const when = props.when ?? ALL_REASONS;
  const deferUnmountMs = props.deferUnmountMs ?? DEFAULT_DEFER_UNMOUNT_MS;
  const { onExit } = props;

  const enabledLeave = when.includes("leave");
  const enabledHide = when.includes("hide");
  const enabledUnmount = when.includes("unmount");

  const onExitRef = useRef(onExit);
  const sessionKeyRef = useRef(sessionKey);
  const enabledHideRef = useRef(enabledHide);
  const enabledUnmountRef = useRef(enabledUnmount);
  const deferUnmountMsRef = useRef(deferUnmountMs);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    enabledHideRef.current = enabledHide;
    enabledUnmountRef.current = enabledUnmount;
    deferUnmountMsRef.current = deferUnmountMs;
  }, [deferUnmountMs, enabledHide, enabledUnmount]);

  useEffect(() => {
    const prev = sessionKeyRef.current;
    if (prev === sessionKey) {
      if (sessionKey != null) flushedKeys.delete(sessionKey);
      return;
    }

    cancelPendingUnmount(prev);

    if (enabledLeave && prev != null && prev !== sessionKey) {
      emit(onExitRef.current, "leave", prev);
    }

    sessionKeyRef.current = sessionKey;
    if (sessionKey != null) flushedKeys.delete(sessionKey);
  }, [enabledLeave, sessionKey]);

  useEffect(() => {
    cancelPendingUnmount(sessionKeyRef.current);

    const onPageHide = () => {
      if (!enabledHideRef.current) return;
      emit(onExitRef.current, "hide", sessionKeyRef.current);
    };
    const onVisibilityChange = () => {
      const key = sessionKeyRef.current;
      if (document.visibilityState === "visible") {
        if (key != null) flushedKeys.delete(key);
        return;
      }
      if (!enabledHideRef.current) return;
      emit(onExitRef.current, "hide", key);
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (!enabledUnmountRef.current) return;
      const key = sessionKeyRef.current;
      if (key == null) return;

      cancelPendingUnmount(key);
      const delay = deferUnmountMsRef.current;
      const timer = setTimeout(() => {
        pendingUnmounts.delete(key);
        emit(onExitRef.current, "unmount", key);
      }, delay);
      pendingUnmounts.set(key, timer);
    };
  }, []);

  return null;
}
