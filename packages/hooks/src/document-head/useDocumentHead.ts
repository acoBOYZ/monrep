import { useEffect } from "react";
import {
  ensureDocumentHeadDefaults,
  resetDocumentHead,
  setDocumentFaviconUnreadDot,
  setDocumentTitle,
} from "./documentHead";

export type UseDocumentHeadOptions = {
  /** `undefined` leaves title alone; `null` restores the default title. */
  title?: string | null;
  /** `undefined` leaves favicon alone; `true`/`false` sets or clears the unread dot. */
  unreadDot?: boolean;
};

export function useDocumentHead({ title, unreadDot }: UseDocumentHeadOptions = {}) {
  useEffect(() => {
    ensureDocumentHeadDefaults();
    return () => {
      resetDocumentHead();
    };
  }, []);

  useEffect(() => {
    if (title === undefined) return;
    setDocumentTitle(title);
  }, [title]);

  useEffect(() => {
    if (unreadDot === undefined) return;
    setDocumentFaviconUnreadDot(unreadDot);
  }, [unreadDot]);
}
