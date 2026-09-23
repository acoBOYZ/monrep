export type OS = "mac" | "ios" | "windows" | "linux" | "android" | "unknown";
export type OSArch = "arm64" | "x64" | "unknown";

type UserAgentData = {
  platform?: string;
  architecture?: string;
};

const readUserAgentData = (): UserAgentData | undefined => {
  if (typeof navigator === "undefined") return undefined;

  const nav: unknown = navigator;
  if (typeof nav !== "object" || nav === null || !("userAgentData" in nav)) {
    return undefined;
  }

  const userAgentData = nav.userAgentData;
  if (typeof userAgentData !== "object" || userAgentData === null) {
    return undefined;
  }

  const platform =
    "platform" in userAgentData && typeof userAgentData.platform === "string"
      ? userAgentData.platform
      : undefined;

  const architecture =
    "architecture" in userAgentData && typeof userAgentData.architecture === "string"
      ? userAgentData.architecture
      : undefined;

  return { platform, architecture };
};

/**
 * Infer {@link OS} from an arbitrary User-Agent string (e.g. audit `user_agent`).
 * Uses the same string heuristics as {@link getOS} when `navigator.userAgentData` is unavailable.
 */
export function getOSFromUserAgent(userAgent: string): OS {
  const ua = userAgent.trim().toLowerCase();
  if (!ua.length) return "unknown";

  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";

  return "unknown";
}

export function getOS(): OS {
  if (typeof navigator === "undefined") return "unknown";

  // ✅ New Chromium API (best)
  const uaData = readUserAgentData();

  if (uaData?.platform) {
    const p = uaData.platform.toLowerCase();

    if (p.includes("mac")) return "mac";
    if (p.includes("windows")) return "windows";
    if (p.includes("linux")) return "linux";
    if (p.includes("android")) return "android";
  }

  // ✅ Fallback (Firefox, Safari) — shared with audit UA strings
  return getOSFromUserAgent(navigator.userAgent);
}

const CHROMIUM_UA = /chrome\/|chromium\/|edg\/|opr\//u;

/**
 * Safari and every iOS browser (all WebKit). Chromium on Mac still reports
 * {@link OS} `"mac"`, so {@link getOS} alone cannot gate WebKit media quirks.
 */
export function isAppleWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  const os = getOS();
  if (os !== "mac" && os !== "ios") return false;
  return !CHROMIUM_UA.test(navigator.userAgent.toLowerCase());
}

export function getArchitecture(): OSArch {
  if (typeof navigator === "undefined") return "unknown";

  const uaData = readUserAgentData();
  const rawArch = typeof uaData?.architecture === "string" ? uaData.architecture.toLowerCase() : "";

  if (rawArch.includes("arm")) return "arm64";
  if (rawArch.includes("x86") || rawArch.includes("x64") || rawArch.includes("amd")) {
    return "x64";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("arm64") || ua.includes("aarch64")) return "arm64";
  if (
    ua.includes("x86_64") ||
    ua.includes("win64") ||
    ua.includes("x64") ||
    ua.includes("amd64") ||
    ua.includes("intel")
  ) {
    return "x64";
  }

  return "unknown";
}
