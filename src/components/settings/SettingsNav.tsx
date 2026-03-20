"use client";

import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
import {
  MessageSquare,
  Shield,
  Building2,
  Brain,
  FolderOpen,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export const SETTINGS_TAB_IDS = ["chat", "access", "company", "ai", "content", "danger"] as const;
export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export const settingsTabLabel: Record<SettingsTabId, string> = {
  chat: "Chat Widget",
  access: "Access Control",
  company: "Company Info",
  ai: "AI Configuration",
  content: "Content & SEO",
  danger: "Danger Zone",
};

const TAB_ORDER: SettingsTabId[] = [...SETTINGS_TAB_IDS];

const icons: Record<SettingsTabId, LucideIcon> = {
  chat: MessageSquare,
  access: Shield,
  company: Building2,
  ai: Brain,
  content: FolderOpen,
  danger: AlertTriangle,
};

function NavButton({
  id,
  active,
  dirty,
  badge,
  onSelect,
  tabIndex,
  onKeyDown,
  buttonRef,
}: {
  id: SettingsTabId;
  active: boolean;
  dirty: boolean;
  badge?: string;
  onSelect: (id: SettingsTabId) => void;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const Icon = icons[id];
  const label = settingsTabLabel[id];
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={`settings-tab-${id}`}
      aria-selected={active}
      aria-controls={`settings-panel-${id}`}
      tabIndex={tabIndex}
      onClick={() => onSelect(id)}
      onKeyDown={onKeyDown}
      className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        active
          ? "bg-slate-800 text-white border-l-4 border-l-red-500 pl-2"
          : "text-slate-300 hover:bg-slate-800/50 border-l-4 border-l-transparent pl-2"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {dirty ? (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" aria-hidden />
      ) : null}
      {badge ? (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-600/90 text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MobileTabButton({
  id,
  active,
  dirty,
  badge,
  onSelect,
  tabIndex,
  onKeyDown,
  buttonRef,
}: {
  id: SettingsTabId;
  active: boolean;
  dirty: boolean;
  badge?: string;
  onSelect: (id: SettingsTabId) => void;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const Icon = icons[id];
  const label = settingsTabLabel[id];
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={`settings-tab-mobile-${id}`}
      aria-selected={active}
      aria-controls={`settings-panel-${id}`}
      tabIndex={tabIndex}
      onClick={() => onSelect(id)}
      onKeyDown={onKeyDown}
      className={`relative shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        active ? "bg-slate-800 text-white ring-1 ring-red-500/40" : "text-slate-300 bg-slate-900/80 hover:bg-slate-800/80"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <span className="truncate max-w-[10rem]">{label}</span>
      {dirty ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden title="Unsaved" /> : null}
      {badge ? (
        <span className="text-[10px] font-semibold uppercase px-1 py-0.5 rounded bg-emerald-600/90 text-white">{badge}</span>
      ) : null}
    </button>
  );
}

export function SettingsNav({
  activeTab,
  onTabChange,
  dirtyByTab,
}: {
  activeTab: SettingsTabId;
  onTabChange: (id: SettingsTabId) => void;
  dirtyByTab: Record<SettingsTabId, boolean>;
}) {
  const desktopRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const focusTab = useCallback((index: number, mobile: boolean) => {
    const arr = mobile ? mobileRefs.current : desktopRefs.current;
    const el = arr[index];
    el?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, mobile: boolean) => {
      const n = TAB_ORDER.length;
      let next = activeIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (activeIndex + 1) % n;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (activeIndex - 1 + n) % n;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = n - 1;
      } else {
        return;
      }
      onTabChange(TAB_ORDER[next]);
      requestAnimationFrame(() => focusTab(next, mobile));
    },
    [activeIndex, onTabChange, focusTab]
  );

  const setDesktopRef = (i: number) => (el: HTMLButtonElement | null) => {
    desktopRefs.current[i] = el;
  };
  const setMobileRef = (i: number) => (el: HTMLButtonElement | null) => {
    mobileRefs.current[i] = el;
  };

  return (
    <>
      <div className="md:hidden -mx-1 px-1 pb-2">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Settings sections"
        >
          {TAB_ORDER.map((id, i) => (
            <MobileTabButton
              key={id}
              id={id}
              active={activeTab === id}
              dirty={dirtyByTab[id]}
              badge={id === "chat" ? "Live" : undefined}
              onSelect={onTabChange}
              tabIndex={activeTab === id ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, true)}
              buttonRef={setMobileRef(i)}
            />
          ))}
        </div>
      </div>

      <nav
        className="hidden md:block w-[220px] shrink-0 sticky top-24 self-start z-[5]"
        aria-label="Settings sections"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 space-y-0.5" role="tablist">
          {TAB_ORDER.map((id, i) => (
            <NavButton
              key={id}
              id={id}
              active={activeTab === id}
              dirty={dirtyByTab[id]}
              badge={id === "chat" ? "Live" : undefined}
              onSelect={onTabChange}
              tabIndex={activeTab === id ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, false)}
              buttonRef={setDesktopRef(i)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
