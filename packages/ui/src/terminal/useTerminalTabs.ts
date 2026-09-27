import { useState } from "react";
import type { TerminalTabSpec } from "./types";

const DEFAULT_TAB_TITLE = "~";

type InternalTab = {
  id: string;
  title: string;
  usesChildren: boolean;
};

const createInternalTab = (title: string, usesChildren: boolean): InternalTab => ({
  id: crypto.randomUUID(),
  title,
  usesChildren,
});

type UseTerminalTabsArgs = {
  controlledTabs?: Array<TerminalTabSpec>;
  controlledActiveTabId?: string;
  onActiveTabChange?: (id: string) => void;
  onTabAdd?: () => void;
  onTabClose?: (id: string) => void;
};

export const useTerminalTabs = ({
  controlledTabs,
  controlledActiveTabId,
  onActiveTabChange,
  onTabAdd,
  onTabClose,
}: UseTerminalTabsArgs) => {
  const [seedTab] = useState(() => createInternalTab(DEFAULT_TAB_TITLE, true));
  const [internalTabs, setInternalTabs] = useState<Array<InternalTab>>(() => [seedTab]);
  const [internalActiveId, setInternalActiveId] = useState(seedTab.id);

  const isTabsControlled = controlledTabs !== undefined;
  const tabs: Array<{ id: string; title: string }> = isTabsControlled
    ? controlledTabs.map(({ id, title }) => ({ id, title }))
    : internalTabs.map(({ id, title }) => ({ id, title }));

  const activeTabId = isTabsControlled
    ? (controlledActiveTabId ?? controlledTabs[0]?.id ?? "")
    : internalActiveId;

  const handleSelectTab = (id: string) => {
    if (id === activeTabId) return;
    if (isTabsControlled) {
      onActiveTabChange?.(id);
      return;
    }
    setInternalActiveId(id);
  };

  const handleAddTab = () => {
    if (isTabsControlled) {
      onTabAdd?.();
      return;
    }
    const tab = createInternalTab(DEFAULT_TAB_TITLE, false);
    setInternalTabs((prev) => [...prev, tab]);
    setInternalActiveId(tab.id);
  };

  const handleCloseTab = (id: string) => {
    if (isTabsControlled) {
      onTabClose?.(id);
      return;
    }
    if (internalTabs.length <= 1) return;
    const remaining = internalTabs.filter((t) => t.id !== id);
    setInternalTabs(remaining);
    if (id === activeTabId) setInternalActiveId(remaining[0]?.id ?? "");
  };

  const activeUsesChildren =
    !isTabsControlled && internalTabs.find((t) => t.id === activeTabId)?.usesChildren === true;

  return {
    isTabsControlled,
    tabs,
    activeTabId,
    activeUsesChildren,
    handleSelectTab,
    handleAddTab,
    handleCloseTab,
  };
};
