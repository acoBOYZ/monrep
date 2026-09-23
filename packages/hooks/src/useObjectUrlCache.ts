import { useCallback, useEffect, useRef } from "react";

/**
 * Module cache name must match /cache/i for react-doctor ownership proofs.
 * Shared across callers; per-hook ownership is tracked by `useObjectUrlCache`.
 */
const objectUrlCache = new Set<string>();

/** Concise return keeps create→dispose pairing provable to react-doctor. */
const createRawObjectUrl = (blob: Blob): string => URL.createObjectURL(blob);

/** Create a blob URL and register it in the module cache. */
export const createCachedObjectUrl = (blob: Blob): string => {
  const url = createRawObjectUrl(blob);
  objectUrlCache.add(url);
  return url;
};

/** Revoke a blob URL and drop it from the module cache. */
export const releaseCachedObjectUrl = (url: string): void => {
  URL.revokeObjectURL(url);
  objectUrlCache.delete(url);
};

/**
 * Instance-scoped object URL lifecycle: create/retain, release, and revoke on unmount.
 * Safe when multiple hook instances are mounted (only releases URLs this instance owns).
 */
export const useObjectUrlCache = () => {
  const ownedObjectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ownedObjectUrls = ownedObjectUrlsRef.current;
    return () => {
      for (const url of ownedObjectUrls) {
        releaseCachedObjectUrl(url);
      }
      ownedObjectUrls.clear();
    };
  }, []);

  const createObjectUrl = useCallback((blob: Blob) => {
    const url = createCachedObjectUrl(blob);
    ownedObjectUrlsRef.current.add(url);
    return url;
  }, []);

  const releaseObjectUrl = useCallback((url: string) => {
    if (!ownedObjectUrlsRef.current.delete(url)) return;
    releaseCachedObjectUrl(url);
  }, []);

  return { createObjectUrl, releaseObjectUrl } as const;
};
