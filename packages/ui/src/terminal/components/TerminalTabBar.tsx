import { AddSquareFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { TooltipTrigger } from "../../base/tooltip/TooltipTrigger";

export type TerminalTabBarItem = {
  id: string;
  title: string;
};

export type TerminalTabBarProps = {
  tabs: Array<TerminalTabBarItem>;
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

export const TerminalTabBar = ({ tabs, activeTabId, onSelect, onClose }: TerminalTabBarProps) => (
  <div
    className="mb-1 flex min-h-8 w-full items-center gap-1.5"
    role="tablist"
    aria-label="Terminal tabs"
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeTabId;
      const closable = tabs.length > 1;
      return (
        <div
          key={tab.id}
          className={cn(
            "group relative flex min-w-0 flex-1 items-center gap-0.5 rounded-lg py-1 pr-2.5 pl-1.5 font-mono text-[11px] leading-none",
            isActive
              ? "bg-accent text-foreground shadow-sm ring-1 ring-border"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.title}
            className="absolute inset-0 z-0 cursor-pointer rounded-lg"
            onClick={() => onSelect(tab.id)}
          />
          <button
            type="button"
            className={cn(
              "relative z-10 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
              "opacity-0 transition-opacity group-hover:opacity-100",
              isActive && "opacity-70 hover:opacity-100",
              "hover:bg-background/50 hover:text-destructive",
              !closable && "invisible",
            )}
            aria-label={`Close ${tab.title}`}
            tabIndex={closable ? 0 : -1}
            onClick={(event) => {
              event.stopPropagation();
              if (!closable) return;
              onClose(tab.id);
            }}
          >
            ×
          </button>
          <span className="pointer-events-none relative z-10 min-w-0 flex-1 truncate px-1 text-left">
            {tab.title}
          </span>
        </div>
      );
    })}
  </div>
);

export type AddMoreTabsProps = {
  onAdd: () => void;
};

export const AddMoreTabs = ({ onAdd }: AddMoreTabsProps) => (
  <TooltipTrigger content="New tab">
    <button
      type="button"
      aria-label="Add more tabs"
      className="flex size-6 shrink-0 items-center justify-center"
      onClick={onAdd}
    >
      <HugeiconsIcon
        icon={AddSquareFreeIcons}
        className="size-4 text-cool hover:text-foreground"
        strokeWidth={2}
      />
    </button>
  </TooltipTrigger>
);
