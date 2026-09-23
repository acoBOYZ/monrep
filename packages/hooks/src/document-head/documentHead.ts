const ICON_SELECTOR = 'link[rel="icon"], link[rel="shortcut icon"]';
const UNREAD_FAVICON_SRC = "/favicon-unread-96x96.png";

let defaultsCaptured = false;
let defaultTitle = "";
let defaultIconHrefs: Array<string> = [];

const isBrowser = () => typeof document !== "undefined";

const queryIconLinks = (): Array<HTMLLinkElement> => {
  return Array.from(document.querySelectorAll<HTMLLinkElement>(ICON_SELECTOR));
};

export const ensureDocumentHeadDefaults = () => {
  if (!isBrowser() || defaultsCaptured) return;
  defaultTitle = document.title;
  defaultIconHrefs = queryIconLinks().map((element) => element.getAttribute("href") ?? "");
  defaultsCaptured = true;
};

const restoreDefaultIcons = () => {
  const links = queryIconLinks();
  links.forEach((link, index) => {
    const href = defaultIconHrefs[index];
    if (href === undefined) return;
    if (href) {
      link.setAttribute("href", href);
    } else {
      link.removeAttribute("href");
    }
  });
};

const applyIconHref = (href: string) => {
  for (const link of queryIconLinks()) {
    link.setAttribute("href", href);
  }
};

export const setDocumentTitle = (title: string | null) => {
  if (!isBrowser()) return;
  ensureDocumentHeadDefaults();
  document.title = title ?? defaultTitle;
};

export const setDocumentFaviconUnreadDot = (enabled: boolean) => {
  if (!isBrowser()) return;
  ensureDocumentHeadDefaults();

  if (enabled) {
    applyIconHref(UNREAD_FAVICON_SRC);
    return;
  }

  restoreDefaultIcons();
};

export const resetDocumentHead = () => {
  if (!isBrowser()) return;
  ensureDocumentHeadDefaults();
  document.title = defaultTitle;
  restoreDefaultIcons();
};
