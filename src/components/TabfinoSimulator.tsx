import { useEffect, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  Bell,
  BookmarkSimple,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  Lock,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react';
import {
  SIMULATED_WORKFLOWS,
  type SimulatedTab,
  type SimulatedWorkflow,
} from '../data/tabfinoData';

type TabSyncStatus = 'Active' | 'Suspended' | 'Syncing';
type PanelView = 'recent' | 'related' | 'settings';

const STATUS_STYLE: Record<
  TabSyncStatus,
  { dotClass: string; textClass: string }
> = {
  Active: {
    dotClass: 'bg-[#2563eb]',
    textClass: 'text-[#1d4ed8]',
  },
  Syncing: {
    dotClass: 'bg-[#60a5fa] ring-2 ring-[#eff4ff]',
    textClass: 'text-[#2563eb]',
  },
  Suspended: {
    dotClass: 'bg-[#d4d9e2]',
    textClass: 'text-[#828b9b]',
  },
};

function getSiteMarkStyle(hostname: string) {
  const host = String(hostname || '').replace(/^www\./, '');
  const letterMatch = host.match(/[a-z0-9]/i);
  const letter = (letterMatch ? letterMatch[0] : '?').toUpperCase();
  let hue = 0;
  for (let i = 0; i < host.length; i += 1) {
    hue = (hue * 31 + host.charCodeAt(i)) % 360;
  }
  return {
    letter,
    style: {
      backgroundColor: `hsl(${hue} 52% 94%)`,
      boxShadow: `inset 0 0 0 1px hsl(${hue} 42% 87%)`,
      color: `hsl(${hue} 40% 35%)`,
    },
  };
}

function SiteMark({
  hostname,
  large = false,
  muted = false,
}: {
  hostname: string;
  large?: boolean;
  muted?: boolean;
}) {
  const { letter, style } = getSiteMarkStyle(hostname);
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`grid shrink-0 place-items-center font-bold leading-none select-none ${
        large ? 'h-7 w-7 rounded-[12px] text-[12px]' : 'h-[22px] w-[22px] rounded-[8px] text-[10px]'
      } ${muted ? 'opacity-75 grayscale' : ''}`}
    >
      {letter}
    </span>
  );
}

export function TabfinoSimulator() {
  const initialWorkflow = SIMULATED_WORKFLOWS[0];
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(initialWorkflow.id);
  const [panelView, setPanelView] = useState<PanelView>('related');
  const [openTabs, setOpenTabs] = useState<SimulatedTab[]>(initialWorkflow.tabs.slice(0, 2));
  const [activeTabId, setActiveTabId] = useState<string>(initialWorkflow.tabs[0].id);
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({
    'security-notes': true,
    'capacity-sheet': true,
  });
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Record<string, boolean>>({
    'docs.internal.example/q4/vendor-matrix': true,
  });
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  const [attentionExpanded, setAttentionExpanded] = useState<boolean>(false);
  const [showIdleReminder, setShowIdleReminder] = useState<boolean>(false);
  const [mobilePane, setMobilePane] = useState<'panel' | 'page'>('panel');
  const [actionFeedback, setActionFeedback] = useState<string>(
    'Select any workflow, open one saved tab, or restore the full session.'
  );
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const selectedWorkflow: SimulatedWorkflow =
    SIMULATED_WORKFLOWS.find((w) => w.id === selectedWorkflowId) ?? initialWorkflow;

  const activeTab: SimulatedTab =
    openTabs.find((t) => t.id === activeTabId) ??
    selectedWorkflow.tabs.find((t) => t.id === activeTabId) ??
    selectedWorkflow.tabs[0];

  const getTabStatus = (tabId: string): TabSyncStatus => {
    if (syncingIds[tabId]) return 'Syncing';
    if (openTabs.some((t) => t.id === tabId)) return 'Active';
    return 'Suspended';
  };

  const triggerSyncThenOpen = (tabsToOpen: SimulatedTab[], focusTab: SimulatedTab, msg: string) => {
    const newSyncIds: Record<string, boolean> = {};
    tabsToOpen.forEach((t) => {
      if (!openTabs.some((open) => open.id === t.id)) {
        newSyncIds[t.id] = true;
      }
    });

    if (Object.keys(newSyncIds).length > 0) {
      setSyncingIds((prev) => ({ ...prev, ...newSyncIds }));
      const tId = window.setTimeout(() => {
        setSyncingIds((prev) => {
          const next = { ...prev };
          Object.keys(newSyncIds).forEach((k) => {
            delete next[k];
          });
          return next;
        });
      }, 450);
      timersRef.current.push(tId);
    }

    setOpenTabs((prev) => {
      const merged = [...prev];
      tabsToOpen.forEach((tab) => {
        if (!merged.some((existing) => existing.id === tab.id)) {
          merged.push(tab);
        }
      });
      return merged;
    });
    setActiveTabId(focusTab.id);
    setShowIdleReminder(false);
    setActionFeedback(msg);
  };

  const handleSelectWorkflow = (workflow: SimulatedWorkflow, openDetail = true) => {
    setSelectedWorkflowId(workflow.id);
    if (openDetail) setPanelView('related');
    setActionFeedback(
      `Inspecting "${workflow.name}" (${workflow.tabCount} tabs · ${workflow.updatedLabel}).`
    );
  };

  const handleOpenSingleTab = (tab: SimulatedTab) => {
    triggerSyncThenOpen(
      [tab],
      tab,
      `Opened single tab "${tab.title}" without restoring the rest.`
    );
  };

  const handleContinueWorkflow = (workflow: SimulatedWorkflow = selectedWorkflow) => {
    const lastActive = workflow.tabs.find((t) => t.isLastActive) ?? workflow.tabs[0];
    setSelectedWorkflowId(workflow.id);
    setSyncingIds({});
    setOpenTabs(workflow.tabs);
    setActiveTabId(lastActive.id);
    setShowIdleReminder(false);
    setActionFeedback(
      `Restored all ${workflow.tabs.length} tabs in "${workflow.name}" · Focused "${lastActive.title}".`
    );
  };

  const handleCloseBrowserTab = (tabId: string) => {
    setOpenTabs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && next.length > 0) {
        setActiveTabId(next[0].id);
      }
      return next;
    });
    setActionFeedback('Closed tab in browser strip · Status updated to Suspended.');
  };

  const handleSimulateInterruption = () => {
    setShowIdleReminder(true);
    setPanelView('recent');
    setActionFeedback('Simulated 45m device inactivity · Optional Chrome return reminder shown.');
  };

  const handleReset = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setSelectedWorkflowId(initialWorkflow.id);
    setPanelView('related');
    setOpenTabs(initialWorkflow.tabs.slice(0, 2));
    setActiveTabId(initialWorkflow.tabs[0].id);
    setSyncingIds({
      'security-notes': true,
      'capacity-sheet': true,
    });
    setTrackingEnabled(true);
    setAttentionExpanded(false);
    setShowIdleReminder(false);
    setMobilePane('panel');
    setActionFeedback('Preview reset to initial state.');
  };

  const toggleBookmark = (tab: SimulatedTab) => {
    const key = `${tab.domain}${tab.path}`;
    setBookmarkedUrls((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openCount = selectedWorkflow.tabs.filter((t) => getTabStatus(t.id) !== 'Suspended').length;
  const closedCount = selectedWorkflow.tabs.length - openCount;
  const openWorkflowTabs = selectedWorkflow.tabs.filter((t) => getTabStatus(t.id) !== 'Suspended');
  const closedWorkflowTabs = selectedWorkflow.tabs.filter((t) => getTabStatus(t.id) === 'Suspended');
  const anchorTab = selectedWorkflow.tabs[0];

  const renderSavedTabRow = (tab: SimulatedTab, isClosedSection = false) => {
    const status = getTabStatus(tab.id);
    const statusStyle = STATUS_STYLE[status];
    const isFocused = activeTab.id === tab.id;
    const bookmarkKey = `${tab.domain}${tab.path}`;
    const isBookmarked = Boolean(bookmarkedUrls[bookmarkKey]);

    return (
      <div
        key={tab.id}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1 border-b border-[#e5e8ee] last:border-b-0"
      >
        <button
          type="button"
          onClick={() => handleOpenSingleTab(tab)}
          className={`group grid w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-[1px] py-2 text-left transition-colors ${
            isFocused ? 'text-[#2563eb]' : ''
          }`}
        >
          <span className="row-span-2">
            <SiteMark hostname={tab.domain} muted={isClosedSection} />
          </span>

          <span
            className={`col-start-2 row-start-1 truncate text-[12px] font-medium ${
              isClosedSection
                ? 'text-[#596274] group-hover:text-[#2563eb]'
                : isFocused
                  ? 'text-[#2563eb]'
                  : 'text-[#16181d] group-hover:text-[#2563eb]'
            }`}
          >
            {tab.title}
            {!isClosedSection && tab.isLastActive && (
              <span
                title="Last active"
                className="ml-1.5 inline-block h-[5px] w-[5px] rounded-full bg-[#2563eb] align-middle"
              />
            )}
          </span>

          <span className="col-start-2 row-start-2 truncate text-[11px] text-[#828b9b]">
            {tab.domain}
            {tab.isLastActive ? ' · Last active' : ''}
          </span>

          <span
            className={`col-start-3 row-span-2 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium ${statusStyle.textClass}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full transition-colors duration-150 ${statusStyle.dotClass}`}
            />
            <span>{status}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleBookmark(tab)}
          aria-label={isBookmarked ? `Remove ${tab.title} from saved` : `Keep ${tab.title} for later`}
          title={isBookmarked ? 'In a folder' : 'Keep for later'}
          className={`grid h-7 w-7 cursor-pointer place-items-center rounded-[8px] transition-colors ${
            isBookmarked
              ? 'text-[#2563eb]'
              : 'text-[#d4d9e2] hover:bg-[#eff4ff] hover:text-[#2563eb]'
          }`}
        >
          <BookmarkSimple size={14} weight={isBookmarked ? 'fill' : 'regular'} />
        </button>
      </div>
    );
  };

  return (
    <figure className="w-full text-left lg:mt-10">
      {/* Studio Simulator Outer Hairline Frame */}
      <div className="hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-2 sm:p-3 lg:block">
        {/* Simulator Toolbar Strip */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 py-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-900">
              <span className="sm:hidden">Workspace preview</span>
              <span className="hidden sm:inline">Interactive workspace preview</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-[var(--font-mono)] text-[11px] text-slate-500 tabular-nums">
              {openTabs.length} open<span className="hidden sm:inline"> in window</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleSimulateInterruption();
                setMobilePane('panel');
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <Bell size={14} weight="regular" className="text-blue-600" />
              <span className="sm:hidden">Simulate idle</span>
              <span className="hidden sm:inline">Simulate interruption</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset interactive preview"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowCounterClockwise size={14} weight="regular" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Browser Window */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Chrome Tab Strip */}
          <div className="flex items-end gap-1 overflow-x-auto border-b border-slate-200 bg-slate-100/80 px-2.5 pt-2 sm:px-3 sm:pt-2.5">
            <div className="mr-2 mb-2.5 hidden items-center gap-1.5 sm:flex" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
            </div>

            {openTabs.map((tab) => {
              const isFocused = tab.id === activeTab.id;
              return (
                <div
                  key={tab.id}
                  className={`group flex max-w-[165px] shrink-0 items-center gap-2 rounded-t-lg border-x border-t px-2.5 py-1.5 text-xs transition-colors sm:max-w-[190px] sm:px-3 sm:py-2 ${
                    isFocused
                      ? 'border-slate-200 bg-white font-medium text-slate-900'
                      : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTabId(tab.id);
                      setMobilePane('page');
                    }}
                    className="min-w-0 flex-1 cursor-pointer truncate text-left"
                  >
                    {tab.title}
                  </button>
                  {openTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCloseBrowserTab(tab.id)}
                      aria-label={`Close ${tab.title}`}
                      className="cursor-pointer rounded p-0.5 text-slate-400 opacity-70 transition-opacity hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chrome Address Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 sm:px-3">
              <Lock size={12} weight="regular" className="shrink-0 text-slate-400" />
              <span className="truncate font-[var(--font-mono)] text-[11px]">
                https://{activeTab.domain}
                {activeTab.path}
              </span>
            </div>
            <span className="hidden shrink-0 font-[var(--font-mono)] text-[11px] text-slate-500 md:inline">
              Side panel open
            </span>
          </div>

          {/* Mobile Pane Switcher (< md only — hidden on tablet and desktop) */}
          <div className="grid grid-cols-2 gap-1 border-b border-slate-200 bg-slate-50/90 p-1.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePane('panel')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mobilePane === 'panel'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabfino panel
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('page')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mobilePane === 'page'
                  ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active tab ({openTabs.length})
            </button>
          </div>

          {/* Browser Split Body: Active Document + Authentic Tabfino Side Panel */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left: Active Browser Page */}
            <div
              className={`relative flex-col justify-between bg-white p-5 md:flex md:min-h-[390px] md:p-6 lg:min-h-[420px] lg:p-8 ${
                mobilePane === 'page' ? 'flex min-h-[340px]' : 'hidden'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-[var(--font-mono)] text-[11px] text-blue-600">
                    {activeTab.domain}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTab.isLastActive ? 'Last active page' : 'Saved page'}</span>
                </div>

                <h3 className="mt-3 font-[var(--font-display)] text-lg font-semibold tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
                  {activeTab.summaryTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{activeTab.summarySubtitle}</p>

                <div className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 lg:mt-6 lg:space-y-3 lg:pt-5">
                  {activeTab.summaryBlocks.map((line, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 lg:px-4 lg:py-3"
                    >
                      <span className="mt-0.5 font-[var(--font-mono)] text-xs font-medium text-slate-400 tabular-nums">
                        0{index + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">{line}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 hidden grid-cols-3 gap-3 lg:grid" aria-hidden="true">
                  <div className="h-14 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <div className="h-2 w-12 rounded bg-slate-200" />
                    <div className="mt-2.5 h-2.5 w-20 rounded bg-slate-200/80" />
                  </div>
                  <div className="h-14 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <div className="h-2 w-14 rounded bg-slate-200" />
                    <div className="mt-2.5 h-2.5 w-16 rounded bg-slate-200/80" />
                  </div>
                  <div className="h-14 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <div className="h-2 w-10 rounded bg-slate-200" />
                    <div className="mt-2.5 h-2.5 w-24 rounded bg-slate-200/80" />
                  </div>
                </div>
              </div>

              {/* Live Action Feedback Bar */}
              <div
                role="status"
                aria-live="polite"
                className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 lg:mt-6"
              >
                <Check size={14} weight="bold" className="shrink-0 text-blue-600" />
                <span>{actionFeedback}</span>
              </div>
            </div>

            {/* Right: Authentic Tabfino Extension Side Panel (from preview.html + sidepanel.css + sidepanel.js) */}
            <aside
              aria-label="Tabfino side panel preview"
              className={`max-h-[460px] flex-col overflow-hidden border-[#e5e8ee] bg-[#f6f7f9] text-[13px] leading-[1.45] tracking-[-0.01em] text-[#16181d] md:flex md:max-h-[500px] md:border-l lg:max-h-[540px] ${
                mobilePane === 'panel' ? 'flex' : 'hidden'
              }`}
            >
              {/* preview-tag strip from preview.html */}
              <div className="flex-none border-b border-[#e5e8ee] bg-[#f1f3f7] px-3 py-1.5 text-center text-[10px] font-semibold tracking-[0.04em] text-[#828b9b]">
                INTERACTIVE PREVIEW · SAMPLE DATA
              </div>

              {/* .topbar */}
              <div className="flex min-h-[56px] flex-none items-center gap-2 border-b border-[#e5e8ee] bg-white py-2 pr-3 pl-4">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <img
                    src="/assets/aistudio/Logo-Icon_03936385.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-[30px] w-[30px] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13px] font-semibold tracking-[-0.2px] text-[#16181d]">
                      Tabfino
                    </p>
                    <p className="m-0 truncate text-[11px] text-[#828b9b]">
                      Pick up where you left off
                    </p>
                  </div>
                </div>

                {/* .status-pill */}
                <button
                  type="button"
                  onClick={() => setTrackingEnabled((prev) => !prev)}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#e5e8ee] bg-white py-[5px] pr-2.5 pl-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
                    trackingEnabled ? 'text-[#16181d]' : 'text-[#596274]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      trackingEnabled
                        ? 'bg-[#15803d] shadow-[0_0_0_3px_rgba(21,128,61,0.18)]'
                        : 'bg-[#828b9b]'
                    }`}
                  />
                  <span>{trackingEnabled ? 'Remembering' : 'Paused'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPanelView(panelView === 'settings' ? 'recent' : 'settings')}
                  aria-label="Settings"
                  className="grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-[8px] text-[#596274] transition-colors hover:bg-[#f1f3f7] hover:text-[#16181d]"
                >
                  <SlidersHorizontal size={16} weight="regular" />
                </button>
              </div>

              {/* .detail-head when in related or settings view */}
              {panelView === 'related' && (
                <div className="flex flex-none items-center gap-2 border-b border-[#e5e8ee] bg-white py-2 pr-4 pl-2">
                  <button
                    type="button"
                    onClick={() => setPanelView('recent')}
                    aria-label="Back to recent work"
                    className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[8px] text-[#596274] hover:bg-[#f1f3f7] hover:text-[#16181d]"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <SiteMark hostname={anchorTab.domain} large />
                  <div className="grid min-w-0 flex-1 gap-[1px]">
                    <h4 className="m-0 truncate text-[15px] leading-[1.3] font-semibold tracking-[-0.2px] text-[#16181d]">
                      {selectedWorkflow.name}
                    </h4>
                    <span className="truncate text-[11px] text-[#828b9b] tabular-nums">
                      {anchorTab.domain} · {openCount} open
                      {closedCount > 0 ? ` · ${closedCount} closed` : ''} ·{' '}
                      {selectedWorkflow.updatedLabel}
                    </span>
                  </div>
                </div>
              )}

              {panelView === 'settings' && (
                <div className="flex flex-none items-center gap-2 border-b border-[#e5e8ee] bg-white py-2 pr-4 pl-2">
                  <button
                    type="button"
                    onClick={() => setPanelView('recent')}
                    aria-label="Back"
                    className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[8px] text-[#596274] hover:bg-[#f1f3f7] hover:text-[#16181d]"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <span className="text-[15px] font-semibold tracking-[-0.2px] text-[#16181d]">
                    Settings
                  </span>
                </div>
              )}

              {/* .content scrollable shell */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                {panelView === 'recent' && (
                  <div className="space-y-4">
                    {/* .return-banner when simulated interruption is triggered */}
                    {showIdleReminder && (
                      <div
                        role="status"
                        className="grid grid-cols-[26px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[12px] border border-[#cddffb] bg-[#eff4ff] py-2 pr-2 pl-3"
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#2563eb] text-xs font-semibold text-white"
                        >
                          ↩
                        </span>
                        <div className="grid min-w-0 gap-[1px]">
                          <strong className="text-[12px] font-semibold text-[#16181d]">
                            Welcome back
                          </strong>
                          <span className="truncate text-[11px] text-[#596274]">
                            {selectedWorkflow.tabs[0].title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenSingleTab(selectedWorkflow.tabs[0])}
                          className="min-h-[30px] cursor-pointer rounded-[12px] bg-[#2563eb] px-2.5 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                          Go to tab
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowIdleReminder(false)}
                          aria-label="Dismiss return reminder"
                          className="grid h-[26px] w-[26px] cursor-pointer place-items-center rounded-[8px] text-[#828b9b] hover:bg-black/5 hover:text-[#16181d]"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    )}

                    {/* .resume card */}
                    <section>
                      <p className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-[#828b9b] uppercase">
                        Pick up where you left off
                      </p>
                      <div className="overflow-hidden rounded-[16px] border border-[#2563eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_1px_3px_rgba(16,24,40,.04)]">
                        <button
                          type="button"
                          onClick={() => handleSelectWorkflow(selectedWorkflow, true)}
                          className="grid w-full cursor-pointer gap-2 p-4 text-left transition-colors hover:bg-[#f1f3f7]"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <SiteMark hostname={anchorTab.domain} large />
                            <span className="min-w-0 flex-1 truncate text-[16px] leading-[1.3] font-semibold tracking-[-0.3px] text-[#16181d]">
                              {selectedWorkflow.name}
                            </span>
                            <CaretRight size={16} weight="bold" className="shrink-0 text-[#d4d9e2]" />
                          </div>
                          <span className="truncate text-[12px] text-[#596274] tabular-nums">
                            {anchorTab.domain} · {openCount} open
                            {closedCount > 0 ? ` · ${closedCount} closed` : ''} ·{' '}
                            {selectedWorkflow.updatedLabel}
                          </span>
                          <span className="flex items-center gap-[5px]">
                            {selectedWorkflow.tabs.slice(0, 5).map((t) => (
                              <SiteMark key={t.id} hostname={t.domain} />
                            ))}
                          </span>
                        </button>

                        <div className="flex items-center justify-between gap-2 border-t border-[#e5e8ee] bg-[#eff4ff] px-4 py-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleSelectWorkflow(selectedWorkflow, true)}
                            className="cursor-pointer font-semibold text-[#2563eb] hover:underline"
                          >
                            View {selectedWorkflow.tabCount} tabs →
                          </button>
                          <span className="text-[#828b9b]">Stored locally</span>
                        </div>
                      </div>
                    </section>

                    {/* .attention-section ("Waiting on you") */}
                    <section className="rounded-[16px] border border-[#e5e8ee] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                      <button
                        type="button"
                        aria-expanded={attentionExpanded}
                        onClick={() => setAttentionExpanded((prev) => !prev)}
                        className="flex w-full cursor-pointer items-center gap-2 text-left"
                      >
                        <div className="grid min-w-0 flex-1 gap-[2px]">
                          <span className="text-[13px] font-semibold text-[#16181d]">
                            Waiting on you
                          </span>
                          <span className="text-[11px] text-[#596274]">
                            1 tab syncing · 1 left unfinished
                          </span>
                        </div>
                        <CaretDown
                          size={16}
                          weight="bold"
                          className={`shrink-0 text-[#828b9b] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            attentionExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {attentionExpanded && (
                        <div className="mt-3 rounded-[12px] border border-[#e5e8ee] bg-white p-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenSingleTab(selectedWorkflow.tabs[2])}
                            className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <SiteMark hostname={selectedWorkflow.tabs[2].domain} />
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-[#16181d]">
                                  {selectedWorkflow.tabs[2].title}
                                </p>
                                <p className="truncate text-[11px] text-[#596274]">
                                  {selectedWorkflow.tabs[2].domain}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-[#2563eb]">↗</span>
                          </button>
                        </div>
                      )}
                    </section>

                    {/* .list-section ("Earlier today") */}
                    <section>
                      <p className="mb-2 flex items-baseline justify-between text-[11px] font-semibold tracking-[0.07em] text-[#828b9b] uppercase">
                        <span>Earlier today</span>
                        <span className="font-medium tracking-normal tabular-nums">
                          {SIMULATED_WORKFLOWS.length - 1}
                        </span>
                      </p>
                      <div className="grid gap-2">
                        {SIMULATED_WORKFLOWS.filter((w) => w.id !== selectedWorkflow.id).map((wf) => {
                          const wfAnchor = wf.tabs[0];
                          return (
                            <button
                              key={wf.id}
                              type="button"
                              onClick={() => handleSelectWorkflow(wf, true)}
                              className="grid w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-[2px] rounded-[12px] border border-[#e5e8ee] bg-white p-3 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors hover:border-[#d4d9e2] hover:bg-[#f1f3f7]"
                            >
                              <span className="row-span-2">
                                <SiteMark hostname={wfAnchor.domain} />
                              </span>
                              <span className="col-start-2 row-start-1 truncate text-[13px] font-semibold text-[#16181d]">
                                {wf.name}
                              </span>
                              <span className="col-start-2 col-end-4 row-start-2 truncate text-[11px] text-[#596274] tabular-nums">
                                {wfAnchor.domain} · {wf.tabCount} tabs
                              </span>
                              <span className="col-start-3 row-start-1 text-[11px] text-[#828b9b] tabular-nums">
                                {wf.updatedLabel}
                              </span>
                              <CaretRight size={14} weight="bold" className="col-start-4 row-span-2 text-[#d4d9e2]" />
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                )}

                {panelView === 'related' && (
                  <div className="space-y-4">
                    {/* Quick workflow switcher pills at top of detail view */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {SIMULATED_WORKFLOWS.map((wf) => (
                        <button
                          key={wf.id}
                          type="button"
                          onClick={() => handleSelectWorkflow(wf, true)}
                          className={`shrink-0 cursor-pointer rounded-[8px] border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            wf.id === selectedWorkflow.id
                              ? 'border-[#cddffb] bg-[#eff4ff] text-[#1d4ed8]'
                              : 'border-[#e5e8ee] bg-white text-[#596274] hover:text-[#16181d]'
                          }`}
                        >
                          {wf.name}
                        </button>
                      ))}
                    </div>

                    {/* Open / Active & Syncing tabs card */}
                    {openWorkflowTabs.length > 0 && (
                      <section>
                        <p className="mb-2 flex items-baseline justify-between text-[11px] font-semibold tracking-[0.07em] text-[#828b9b] uppercase">
                          <span>Open tabs</span>
                          <span className="font-medium tracking-normal tabular-nums">
                            {openWorkflowTabs.length}
                          </span>
                        </p>
                        <div className="rounded-[16px] border border-[#e5e8ee] bg-white px-3 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                          {openWorkflowTabs.map((tab) => renderSavedTabRow(tab, false))}
                        </div>
                      </section>
                    )}

                    {/* You closed these (Suspended tabs in sunken card matching .is-closed-card) */}
                    {closedWorkflowTabs.length > 0 && (
                      <section>
                        <p className="mb-2 flex items-baseline justify-between text-[11px] font-semibold tracking-[0.07em] text-[#828b9b] uppercase">
                          <span>You closed these</span>
                          <span className="font-medium tracking-normal tabular-nums">
                            {closedWorkflowTabs.length}
                          </span>
                        </p>
                        <div className="rounded-[16px] border border-[#e5e8ee] bg-[#f1f3f7] px-3 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                          {closedWorkflowTabs.map((tab) => renderSavedTabRow(tab, true))}
                        </div>
                        <p className="mt-2 text-[11px] leading-[1.45] text-[#828b9b]">
                          Chrome forgets a tab the moment you close it. These stay recoverable.
                        </p>
                      </section>
                    )}
                  </div>
                )}

                {panelView === 'settings' && (
                  <div className="space-y-3">
                    <div className="rounded-[16px] border border-[#e5e8ee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-[#16181d]">
                            {trackingEnabled ? 'Pause memory' : 'Resume memory'}
                          </p>
                          <p className="mt-1 text-[11px] leading-[1.5] text-[#596274]">
                            {trackingEnabled
                              ? 'Tabfino is saving tab titles and URLs locally.'
                              : 'Memory is paused. No new browser activity is saved.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={trackingEnabled}
                          onClick={() => setTrackingEnabled((prev) => !prev)}
                          className={`relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                            trackingEnabled ? 'bg-[#2563eb]' : 'bg-[#d4d9e2]'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              trackingEnabled ? 'translate-x-4' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-[#e5e8ee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                      <p className="text-[13px] font-semibold text-[#16181d]">
                        What Tabfino stores
                      </p>
                      <div className="mt-2.5 grid gap-1.5 text-[11px] text-[#596274]">
                        <span className="flex items-center gap-1.5">
                          <Check size={14} weight="bold" className="shrink-0 text-[#15803d]" />
                          <span>Tab titles, URLs, and activity timestamps on this device</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Check size={14} weight="bold" className="shrink-0 text-[#15803d]" />
                          <span>No page text, screenshots, messages, or keystrokes</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Check size={14} weight="bold" className="shrink-0 text-[#15803d]" />
                          <span>No server upload or account sync</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* .actionbar with authentic Figma "Resume / Continue work" dark plate button (--night) */}
              {panelView !== 'settings' && (
                <div className="flex flex-none flex-col items-stretch gap-1 border-t border-[#e5e8ee] bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleContinueWorkflow(selectedWorkflow)}
                    className="btn-tabfino flex w-full cursor-pointer gap-2 text-[15px] font-semibold tracking-[-0.1px]"
                  >
                    <span>Continue work</span>
                    <span aria-hidden="true" className="text-[14px] leading-none">
                      →
                    </span>
                  </button>
                  {panelView === 'related' && (
                    <button
                      type="button"
                      onClick={() => setPanelView('recent')}
                      className="min-h-[30px] w-full cursor-pointer rounded-[12px] text-[12px] font-medium text-[#596274] transition-colors hover:bg-[#f1f3f7] hover:text-[#16181d]"
                    >
                      All recent workflows
                    </button>
                  )}
                </div>
              )}
            </aside>
          </div>

          {/* Mobile live action feedback footer when viewing the side panel */}
          {mobilePane === 'panel' && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 border-t border-slate-200 bg-white px-3.5 py-2 text-[11px] text-slate-500 md:hidden"
            >
              <Check size={14} weight="bold" className="shrink-0 text-blue-600" />
              <span className="truncate">{actionFeedback}</span>
            </div>
          )}
        </div>
      </div>

      <figcaption className="mt-3 hidden text-center text-xs text-slate-500 lg:block">
        Interactive preview with example data. Nothing here is real browsing.
      </figcaption>
    </figure>
  );
}
